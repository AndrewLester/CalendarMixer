import moment from 'moment';

const schoologyTimestampFormat = 'YYYY-MM-DD hh:mm:ss';

export function timeToMoment(schoologyTimestamp: string): moment.Moment {
    return moment(schoologyTimestamp, schoologyTimestampFormat);
}
