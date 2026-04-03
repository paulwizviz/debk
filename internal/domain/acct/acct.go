package acct

const (
	TblAcct     = "account"
	ColAcctID   = "id"
	ColAcctCode = "code"
	ColAcctName = "name"
	ColAcctType = "type"
	ColIsTemp   = "is_temp"
	ColIsContra = "is_contra"

	// Account types
	Asset     = "Asset"
	Liability = "Liability"
	Equity    = "Equity"
	Revenue   = "Revenue"
	Expense   = "Expense"
)

var (
	CreateAcctTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblAcct + ` (
		` + ColAcctID + ` INTEGER PRIMARY KEY,
		` + ColAcctCode + ` TEXT UNIQUE NOT NULL,
		` + ColAcctName + ` TEXT NOT NULL,
		` + ColAcctType + ` TEXT NOT NULL,
		` + ColIsTemp + ` BOOLEAN NOT NULL,
		` + ColIsContra + ` BOOLEAN NOT NULL
	)`
)

// Detail represents the details of an account, including its ID, code, name, type, and whether it is temporary or a contra account.
type Detail struct {
	ID       int
	Code     string
	Name     string
	Type     string
	IsTemp   bool
	IsContra bool
}
