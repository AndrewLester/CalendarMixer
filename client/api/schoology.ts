import moment, { Moment } from 'moment';


const schoologyTimestampFormat = 'YYYY-MM-DD hh:mm:ss';


export function timeToMoment(schoologyTimestamp: string): Moment {
    return moment(schoologyTimestamp, schoologyTimestampFormat);
}