package report

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"debk/internal/domain/acct"
	"debk/internal/domain/jnlentry"
)

// TrialBalanceLine is one row of a trial balance report.
type TrialBalanceLine struct {
	AccountID int     `json:"account_id"`
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	IsContra  bool    `json:"is_contra"`
	Debit     float64 `json:"debit"`
	Credit    float64 `json:"credit"`
}

// IncomeLine is a revenue or expense aggregate.
type IncomeLine struct {
	AccountID int     `json:"account_id"`
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	Amount    float64 `json:"amount"`
}

// IncomeStatement is P&L for a date range.
type IncomeStatement struct {
	From           time.Time    `json:"from"`
	To             time.Time    `json:"to"`
	RevenueLines   []IncomeLine `json:"revenue_lines"`
	ExpenseLines   []IncomeLine `json:"expense_lines"`
	TotalRevenue   float64      `json:"total_revenue"`
	TotalExpenses  float64      `json:"total_expenses"`
	NetIncome      float64      `json:"net_income"`
}

// BalanceSheetLine is one line on the balance sheet.
type BalanceSheetLine struct {
	AccountID int     `json:"account_id"`
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	IsContra  bool    `json:"is_contra"`
	Amount    float64 `json:"amount"`
}

// BalanceSheet groups permanent accounts at a date.
type BalanceSheet struct {
	AsOf          time.Time          `json:"as_of"`
	Assets        []BalanceSheetLine `json:"assets"`
	Liabilities   []BalanceSheetLine `json:"liabilities"`
	Equity        []BalanceSheetLine `json:"equity"`
	TotalAssets   float64            `json:"total_assets"`
	TotalLiab     float64            `json:"total_liabilities"`
	TotalEquity   float64            `json:"total_equity"`
	UnclosedPL    float64            `json:"unclosed_pl"`
	EquationDelta float64            `json:"equation_delta"`
}

// Service builds financial reports from posted journals.
type Service struct {
	db *sql.DB
}

// NewService creates a report service.
func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func normalDebitBalance(a acct.Detail) bool {
	switch a.Type {
	case acct.Expense:
		return true
	case acct.Asset:
		return !a.IsContra
	case acct.Revenue, acct.Liability, acct.Equity:
		return false
	default:
		return false
	}
}

func trialColumns(debits, credits float64, a acct.Detail) (dr, cr float64) {
	netDC := debits - credits
	if normalDebitBalance(a) {
		if netDC >= 0 {
			return netDC, 0
		}
		return 0, -netDC
	}
	netCD := credits - debits
	if netCD >= 0 {
		return 0, netCD
	}
	return -netCD, 0
}

type lineAgg struct {
	debits  float64
	credits float64
}

// TrialBalance lists account balances with debits and credits columns through asOf (inclusive by date).
func (s *Service) TrialBalance(ctx context.Context, businessID int, asOf time.Time) ([]TrialBalanceLine, error) {
	if businessID == 0 {
		businessID = 1
	}
	asOfDay := asOf.UTC().Format(time.DateOnly)

	q := fmt.Sprintf(`
SELECT a.%s, a.%s, a.%s, a.%s, a.%s,
       COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0)
FROM %s a
LEFT JOIN %s l ON l.%s = a.%s
LEFT JOIN %s e ON e.%s = l.%s AND date(e.%s) <= date(?)
WHERE a.%s = ?
GROUP BY a.%s
HAVING ABS(COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0)) > 1e-9
    OR ABS(COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0)) > 1e-9
ORDER BY a.%s
`,
		acct.ColAcctID, acct.ColAcctCode, acct.ColAcctName, acct.ColAcctType, acct.ColIsContra,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		acct.TblAcct,
		jnlentry.TblLine, jnlentry.ColLineAcctID, acct.ColAcctID,
		jnlentry.TblEntry, jnlentry.ColEntryID, jnlentry.ColLineEntryID,
		jnlentry.ColEntryDate,
		acct.ColAcctBusiness,
		acct.ColAcctID,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		acct.ColAcctCode,
	)

	rows, err := s.db.QueryContext(ctx, q,
		jnlentry.Debit, jnlentry.Credit,
		asOfDay,
		businessID,
		jnlentry.Debit, jnlentry.Credit,
	)
	if err != nil {
		return nil, fmt.Errorf("trial balance query: %w", err)
	}
	defer rows.Close()

	var out []TrialBalanceLine
	for rows.Next() {
		var line TrialBalanceLine
		var debits, credits float64
		if err := rows.Scan(&line.AccountID, &line.Code, &line.Name, &line.Type, &line.IsContra, &debits, &credits); err != nil {
			return nil, fmt.Errorf("scan trial balance: %w", err)
		}
		a := acct.Detail{Type: line.Type, IsContra: line.IsContra}
		line.Debit, line.Credit = trialColumns(debits, credits, a)
		out = append(out, line)
	}
	return out, nil
}

func (s *Service) aggregatesByAccount(ctx context.Context, businessID int, from, to time.Time, types ...string) (map[int]lineAgg, error) {
	if businessID == 0 {
		businessID = 1
	}
	fromDay := from.UTC().Format(time.DateOnly)
	toDay := to.UTC().Format(time.DateOnly)

	typePlaceholders := ""
	for i := range types {
		if i > 0 {
			typePlaceholders += ","
		}
		typePlaceholders += "?"
	}

	q := fmt.Sprintf(`
SELECT a.%s,
       COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN l.%s = ? THEN l.%s ELSE 0 END), 0)
FROM %s a
JOIN %s l ON l.%s = a.%s
JOIN %s e ON e.%s = l.%s
WHERE a.%s = ?
  AND a.%s IN (%s)
  AND date(e.%s) >= date(?)
  AND date(e.%s) <= date(?)
GROUP BY a.%s
`,
		acct.ColAcctID,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		jnlentry.ColLineSide, jnlentry.ColLineAmount,
		acct.TblAcct,
		jnlentry.TblLine, jnlentry.ColLineAcctID, acct.ColAcctID,
		jnlentry.TblEntry, jnlentry.ColEntryID, jnlentry.ColLineEntryID,
		acct.ColAcctBusiness,
		acct.ColAcctType, typePlaceholders,
		jnlentry.ColEntryDate,
		jnlentry.ColEntryDate,
		acct.ColAcctID,
	)

	args := []any{jnlentry.Debit, jnlentry.Credit, businessID}
	for _, t := range types {
		args = append(args, t)
	}
	args = append(args, fromDay, toDay)

	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("aggregate query: %w", err)
	}
	defer rows.Close()

	out := make(map[int]lineAgg)
	for rows.Next() {
		var id int
		var g lineAgg
		if err := rows.Scan(&id, &g.debits, &g.credits); err != nil {
			return nil, err
		}
		out[id] = g
	}
	return out, nil
}

// IncomeStatement builds P&L for [from, to] inclusive by date.
func (s *Service) IncomeStatement(ctx context.Context, businessID int, from, to time.Time) (*IncomeStatement, error) {
	if businessID == 0 {
		businessID = 1
	}
	revAgg, err := s.aggregatesByAccount(ctx, businessID, from, to, acct.Revenue)
	if err != nil {
		return nil, err
	}
	expAgg, err := s.aggregatesByAccount(ctx, businessID, from, to, acct.Expense)
	if err != nil {
		return nil, err
	}

	acctRepo := acct.NewRepository(s.db)
	accounts, err := acctRepo.ListForBusiness(ctx, businessID)
	if err != nil {
		return nil, err
	}

	st := &IncomeStatement{From: from, To: to}
	for _, a := range accounts {
		if a.Type == acct.Revenue {
			g := revAgg[a.ID]
			net := g.credits - g.debits
			if net != 0 {
				st.RevenueLines = append(st.RevenueLines, IncomeLine{
					AccountID: a.ID, Code: a.Code, Name: a.Name, Type: a.Type, Amount: net,
				})
				st.TotalRevenue += net
			}
		}
		if a.Type == acct.Expense {
			g := expAgg[a.ID]
			net := g.debits - g.credits
			if net != 0 {
				st.ExpenseLines = append(st.ExpenseLines, IncomeLine{
					AccountID: a.ID, Code: a.Code, Name: a.Name, Type: a.Type, Amount: net,
				})
				st.TotalExpenses += net
			}
		}
	}
	st.NetIncome = st.TotalRevenue - st.TotalExpenses
	return st, nil
}

func balanceFromTBLine(a acct.Detail, ln TrialBalanceLine) float64 {
	if normalDebitBalance(a) {
		return ln.Debit - ln.Credit
	}
	return ln.Credit - ln.Debit
}

// BalanceSheet shows permanent accounts at asOf plus unclosed P&L (open revenue/expense) hint.
func (s *Service) BalanceSheet(ctx context.Context, businessID int, asOf time.Time) (*BalanceSheet, error) {
	if businessID == 0 {
		businessID = 1
	}
	lines, err := s.TrialBalance(ctx, businessID, asOf)
	if err != nil {
		return nil, err
	}

	acctRepo := acct.NewRepository(s.db)
	accounts, err := acctRepo.ListForBusiness(ctx, businessID)
	if err != nil {
		return nil, err
	}

	bs := &BalanceSheet{AsOf: asOf}
	tbMap := make(map[int]TrialBalanceLine)
	for _, ln := range lines {
		tbMap[ln.AccountID] = ln
	}

	var revTB, expTB float64
	for _, a := range accounts {
		ln, ok := tbMap[a.ID]
		if !ok {
			continue
		}
		switch a.Type {
		case acct.Revenue:
			revTB += ln.Credit - ln.Debit
		case acct.Expense:
			expTB += ln.Debit - ln.Credit
		}
	}
	bs.UnclosedPL = revTB - expTB

	for _, a := range accounts {
		if a.Type == acct.Revenue || a.Type == acct.Expense {
			continue
		}
		ln, ok := tbMap[a.ID]
		if !ok {
			continue
		}
		amt := balanceFromTBLine(a, ln)
		bl := BalanceSheetLine{
			AccountID: a.ID, Code: a.Code, Name: a.Name, Type: a.Type, IsContra: a.IsContra, Amount: amt,
		}
		switch a.Type {
		case acct.Asset:
			bs.Assets = append(bs.Assets, bl)
			bs.TotalAssets += amt
		case acct.Liability:
			bs.Liabilities = append(bs.Liabilities, bl)
			bs.TotalLiab += amt
		case acct.Equity:
			bs.Equity = append(bs.Equity, bl)
			bs.TotalEquity += amt
		}
	}

	bs.EquationDelta = bs.TotalAssets - bs.TotalLiab - bs.TotalEquity - bs.UnclosedPL
	return bs, nil
}
