package acct

// Template is a predefined chart-of-accounts starter set for a type of
// enterprise. Applying a template is a one-time bootstrap: it only seeds an
// empty chart (Retained Earnings aside) and the resulting accounts can be
// freely extended afterwards through the normal bookkeeping screens.
type Template struct {
	Key         string   `json:"key"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Accounts    []Detail `json:"accounts"`
}

// commonCore returns the accounts shared by every enterprise template. A fresh
// slice is returned on each call so callers may safely append to it.
func commonCore() []Detail {
	return []Detail{
		// Assets
		{Code: "1000", Name: "Bank current account", Type: Asset},
		{Code: "1010", Name: "Cash in hand", Type: Asset},
		{Code: "1100", Name: "Trade debtors", Type: Asset},
		{Code: "1200", Name: "Prepayments", Type: Asset},
		{Code: "1500", Name: "Office equipment", Type: Asset},
		{Code: "1510", Name: "Accumulated depreciation – office equipment", Type: Asset, IsContra: true},

		// Liabilities
		{Code: "2100", Name: "Trade creditors", Type: Liability},
		{Code: "2200", Name: "VAT control", Type: Liability},
		{Code: "2210", Name: "PAYE / NIC payable", Type: Liability},
		{Code: "2300", Name: "Accruals", Type: Liability},
		{Code: "2400", Name: "Loans payable", Type: Liability},

		// Equity (3999 Retained Earnings is provisioned separately)
		{Code: "3000", Name: "Capital introduced", Type: Equity},
		{Code: "3100", Name: "Drawings / dividends", Type: Equity, IsTemp: true},

		// Revenue
		{Code: "4900", Name: "Other income", Type: Revenue, IsTemp: true},

		// Overheads
		{Code: "6000", Name: "Wages & salaries", Type: Expense, IsTemp: true},
		{Code: "6100", Name: "Rent", Type: Expense, IsTemp: true},
		{Code: "6110", Name: "Light, heat & power", Type: Expense, IsTemp: true},
		{Code: "6200", Name: "Insurance", Type: Expense, IsTemp: true},
		{Code: "6300", Name: "Advertising & marketing", Type: Expense, IsTemp: true},
		{Code: "6400", Name: "Accountancy & legal fees", Type: Expense, IsTemp: true},
		{Code: "6500", Name: "Bank charges", Type: Expense, IsTemp: true},
		{Code: "6600", Name: "Office & administration", Type: Expense, IsTemp: true},
		{Code: "6700", Name: "Depreciation", Type: Expense, IsTemp: true},
		{Code: "6800", Name: "Travel & subsistence", Type: Expense, IsTemp: true},
	}
}

// builtinTemplates is the ordered set of enterprise starter charts. It is built
// lazily by BuiltinTemplates so the shared core is never mutated.
func builtinTemplates() []Template {
	return []Template{
		{
			Key:         "professional-services",
			Name:        "Professional services",
			Description: "Consultancies, agencies and practices billing fees for time and expertise (no stock).",
			Accounts: append(commonCore(),
				Detail{Code: "4000", Name: "Fees income", Type: Revenue, IsTemp: true},
				Detail{Code: "4100", Name: "Consultancy income", Type: Revenue, IsTemp: true},
				Detail{Code: "5000", Name: "Subcontractor costs", Type: Expense, IsTemp: true},
				Detail{Code: "6210", Name: "Professional indemnity insurance", Type: Expense, IsTemp: true},
				Detail{Code: "6810", Name: "Software subscriptions", Type: Expense, IsTemp: true},
				Detail{Code: "6820", Name: "Training & professional development", Type: Expense, IsTemp: true},
			),
		},
		{
			Key:         "retail",
			Name:        "Retail",
			Description: "Shops selling goods over the counter, holding stock and taking card payments.",
			Accounts: append(commonCore(),
				Detail{Code: "1110", Name: "Card settlements receivable", Type: Asset},
				Detail{Code: "1300", Name: "Stock (inventory)", Type: Asset},
				Detail{Code: "4000", Name: "Sales", Type: Revenue, IsTemp: true},
				Detail{Code: "5000", Name: "Cost of goods sold", Type: Expense, IsTemp: true},
				Detail{Code: "5010", Name: "Purchases", Type: Expense, IsTemp: true},
				Detail{Code: "5020", Name: "Carriage inwards", Type: Expense, IsTemp: true},
				Detail{Code: "5030", Name: "Stock adjustments & shrinkage", Type: Expense, IsTemp: true},
				Detail{Code: "6130", Name: "Business rates", Type: Expense, IsTemp: true},
				Detail{Code: "6510", Name: "Card processing fees", Type: Expense, IsTemp: true},
			),
		},
		{
			Key:         "e-commerce",
			Name:        "E-commerce",
			Description: "Online sellers shipping goods, with payment gateways, marketplaces and fulfilment costs.",
			Accounts: append(commonCore(),
				Detail{Code: "1120", Name: "Payment gateway clearing", Type: Asset},
				Detail{Code: "1300", Name: "Stock (inventory)", Type: Asset},
				Detail{Code: "4000", Name: "Online sales", Type: Revenue, IsTemp: true},
				Detail{Code: "4010", Name: "Marketplace sales", Type: Revenue, IsTemp: true},
				Detail{Code: "4200", Name: "Shipping income", Type: Revenue, IsTemp: true},
				Detail{Code: "5000", Name: "Cost of goods sold", Type: Expense, IsTemp: true},
				Detail{Code: "5010", Name: "Purchases", Type: Expense, IsTemp: true},
				Detail{Code: "5040", Name: "Fulfilment & packaging", Type: Expense, IsTemp: true},
				Detail{Code: "5050", Name: "Postage & shipping", Type: Expense, IsTemp: true},
				Detail{Code: "5060", Name: "Returns & refunds", Type: Expense, IsTemp: true},
				Detail{Code: "6310", Name: "Online advertising", Type: Expense, IsTemp: true},
				Detail{Code: "6520", Name: "Payment gateway fees", Type: Expense, IsTemp: true},
				Detail{Code: "6530", Name: "Marketplace & platform fees", Type: Expense, IsTemp: true},
				Detail{Code: "6830", Name: "Website & hosting", Type: Expense, IsTemp: true},
			),
		},
		{
			Key:         "manufacturing",
			Name:        "Manufacturing",
			Description: "Makers converting raw materials into finished goods, with WIP and plant assets.",
			Accounts: append(commonCore(),
				Detail{Code: "1300", Name: "Raw materials", Type: Asset},
				Detail{Code: "1310", Name: "Work in progress", Type: Asset},
				Detail{Code: "1320", Name: "Finished goods", Type: Asset},
				Detail{Code: "1520", Name: "Plant & machinery", Type: Asset},
				Detail{Code: "1530", Name: "Accumulated depreciation – plant & machinery", Type: Asset, IsContra: true},
				Detail{Code: "4000", Name: "Sales of goods", Type: Revenue, IsTemp: true},
				Detail{Code: "5000", Name: "Cost of goods sold", Type: Expense, IsTemp: true},
				Detail{Code: "5010", Name: "Raw materials purchases", Type: Expense, IsTemp: true},
				Detail{Code: "5100", Name: "Direct labour", Type: Expense, IsTemp: true},
				Detail{Code: "5200", Name: "Manufacturing overheads", Type: Expense, IsTemp: true},
				Detail{Code: "5300", Name: "Carriage inwards", Type: Expense, IsTemp: true},
				Detail{Code: "6140", Name: "Factory rent & rates", Type: Expense, IsTemp: true},
				Detail{Code: "6710", Name: "Depreciation – plant & machinery", Type: Expense, IsTemp: true},
			),
		},
	}
}

// BuiltinTemplates returns the available enterprise starter charts in display
// order.
func BuiltinTemplates() []Template {
	return builtinTemplates()
}

// FindTemplate returns the template matching key, if any.
func FindTemplate(key string) (Template, bool) {
	for _, t := range builtinTemplates() {
		if t.Key == key {
			return t, true
		}
	}
	return Template{}, false
}
