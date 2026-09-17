import {
  parseAmountCell,
  parseDateCellToMonth,
  parseStatementCsv,
  suggestBillsFromTransactions,
} from "../src/lib/statementImport";

// GTBank-style: account preamble rows, Debit/Credit columns, dd-MMM-yyyy dates
const gtb = `Account Statement,,,,,
Account Number,0123456789,,,,
Trans. Date,Value Date,Narration,Debit,Credit,Balance
01-Jun-2026,01-Jun-2026,"NIP TRF LANDLORD RENT/REF123",300000.00,,1200000.00
03-Jun-2026,03-Jun-2026,"POS PURCHASE SHOPRITE LEKKI",24500.00,,1175500.00
05-Jun-2026,05-Jun-2026,"GOTV SUBSCRIPTION 8829102",12500.00,,1163000.00
28-Jun-2026,28-Jun-2026,"SALARY JUNE",,900000.00,2063000.00
01-Jul-2026,01-Jul-2026,"NIP TRF LANDLORD RENT/REF999",300000.00,,1763000.00
06-Jul-2026,06-Jul-2026,"GOTV SUBSCRIPTION 9911223",12500.00,,1750500.00
15-Jul-2026,15-Jul-2026,"POS PURCHASE ONE OFF GADGET",85000.00,,1665500.00
28-Jul-2026,28-Jul-2026,"SALARY JULY",,900000.00,2565500.00
01-Aug-2026,01-Aug-2026,"NIP TRF LANDLORD RENT/REF555",300000.00,,2265500.00
04-Aug-2026,04-Aug-2026,"GOTV SUBSCRIPTION 7712834",12800.00,,2252700.00
`;

// Fintech-style: single signed Amount column, ISO dates
const fintech = `Date,Description,Amount
2026-06-02,Netflix.com Subscription,-5500
2026-06-10,Transfer from Ade,150000
2026-07-02,Netflix.com Subscription,-5500
2026-08-02,Netflix.com Subscription,-5500
2026-08-11,"Jumia order, one time",-42000
`;

const r1 = parseStatementCsv(gtb);
console.log(
  "GTB debits:",
  r1.transactions.length,
  "range:",
  r1.firstMonth,
  "→",
  r1.lastMonth,
);
console.log(suggestBillsFromTransactions(r1.transactions));

const r2 = parseStatementCsv(fintech);
console.log("Fintech debits:", r2.transactions.length);
console.log(suggestBillsFromTransactions(r2.transactions));

console.log("amount cells:", [
  parseAmountCell("₦12,500.00"),
  parseAmountCell("(1,200)"),
  parseAmountCell("1.200,50"),
  parseAmountCell(""),
]);
console.log("dates:", [
  parseDateCellToMonth("14/03/2026"),
  parseDateCellToMonth("01-Jun-2026"),
  parseDateCellToMonth("2026-03-14"),
  parseDateCellToMonth("Mar 14, 2026"),
  parseDateCellToMonth("garbage"),
]);
