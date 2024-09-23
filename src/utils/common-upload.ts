const dayjs = require('dayjs');

export function numericCheck(chkVal, regEx) {
    if (chkVal !== null && chkVal.trim().length > 0 && chkVal.match(regEx)) {
      return "1";
    }
  
    return null;
}

export function isValidPositive(chkVal) {
    if (chkVal !== null && chkVal.trim().length > 0) {
      try {
        const tmpVal = Number(chkVal);
        if (tmpVal <= 0) {
          return false;
        }
      } catch (ex) {
        // Handle the exception if needed
      }
    }
  
    return true;
}

export function dateCheck(chkVal) {
    if (chkVal !== null && chkVal.trim().length > 0 && isValidDateReliable(chkVal)) {
      return "1";
    }
  
    return null;
  }

function isValidDateReliable(strDate) {

  const dateFormat = "DD/MM/YYYY";

  try {
    const testDate = dayjs(strDate, { format: dateFormat, strict: true });
    console.log(strDate)
    console.log(testDate.isValid())
    return testDate.isValid();
  } catch (ex) {
    return false;
  }
}