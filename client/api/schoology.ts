import moment from 'moment';

const schoologyTimestampFormat = 'YYYY-MM-DD HH:mm:ss';

export function timeToMoment(schoologyTimestamp: string): moment.Moment {
    return moment(schoologyTimestamp, schoologyTimestampFormat);
}

export function momentToTime(momentInstance: moment.Moment): string {
    return momentInstance.format(schoologyTimestampFormat);
}