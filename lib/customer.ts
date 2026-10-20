export type Customer = {
  fullName: string;
  dob: string;
  accountLast4: string;
  homeCity: string;
  balanceInr: number;
  passphrase: string;
};

function required(name: string): string | null {
  const value = process.env[name];
  if (!value || !value.trim()) return null;
  return value.trim();
}

/** Fictional customer for this deployment. Missing env means the tools stay closed. */
export function readCustomer(): Customer | null {
  const fullName = required("MERIDIAN_CUSTOMER_NAME");
  const dob = required("MERIDIAN_DOB");
  const accountLast4 = required("MERIDIAN_ACCOUNT_LAST4");
  const homeCity = required("MERIDIAN_HOME_CITY");
  const balance = required("MERIDIAN_BALANCE_INR");
  const passphrase = required("MERIDIAN_PASSPHRASE");
  if (!fullName || !dob || !accountLast4 || !homeCity || !balance || !passphrase) {
    return null;
  }
  const balanceInr = Number(balance);
  if (!Number.isFinite(balanceInr)) return null;
  return { fullName, dob, accountLast4, homeCity, balanceInr, passphrase };
}
