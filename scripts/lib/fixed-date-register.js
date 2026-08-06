"use strict";

const INSTALL_MARKER = Symbol.for("freehub.fixedDateRegister");
const asOfDate = String(process.env.FREEHUB_AS_OF_DATE || "").trim();

if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
  throw new Error("FREEHUB_AS_OF_DATE must be set to a valid YYYY-MM-DD date before loading fixed-date-register.js.");
}

const [year, month, day] = asOfDate.split("-").map(Number);
const RealDate = globalThis.Date;
const fixedDate = new RealDate(year, month - 1, day, 12, 0, 0, 0);

if (
  Number.isNaN(fixedDate.getTime()) ||
  fixedDate.getFullYear() !== year ||
  fixedDate.getMonth() !== month - 1 ||
  fixedDate.getDate() !== day
) {
  throw new Error("FREEHUB_AS_OF_DATE must be set to a valid YYYY-MM-DD date before loading fixed-date-register.js.");
}

const existingInstall = globalThis[INSTALL_MARKER];
if (existingInstall && existingInstall.asOfDate !== asOfDate) {
  throw new Error(
    `fixed-date-register.js is already installed for ${existingInstall.asOfDate}, not ${asOfDate}.`
  );
}

if (!existingInstall) {
  const fixedTimestamp = fixedDate.getTime();
  const FixedDate = new Proxy(RealDate, {
    apply(target) {
      return new target(fixedTimestamp).toString();
    },
    construct(target, argumentsList, newTarget) {
      const dateArguments = argumentsList.length === 0 ? [fixedTimestamp] : argumentsList;
      return Reflect.construct(target, dateArguments, newTarget);
    },
    get(target, property, receiver) {
      if (property === "now") {
        return () => fixedTimestamp;
      }

      return Reflect.get(target, property, receiver);
    },
  });

  globalThis.Date = FixedDate;
  Object.defineProperty(globalThis, INSTALL_MARKER, {
    value: Object.freeze({ asOfDate, fixedTimestamp }),
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
