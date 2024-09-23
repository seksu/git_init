export const getCurrentDateLocalTimeZone = () => {

    let currentDate = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Bangkok'}))
    return currentDate
};

export const getCurrentYear = () => {

    let currentYear = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Bangkok'})).getFullYear()
    return currentYear
};