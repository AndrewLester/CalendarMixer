export interface EventInfo {
    id: number,
    title: string,
    description: string,
    start: string,
    has_end: number,
    all_day: number,
    realm: string,
    end?: string,
    filtered?: boolean
}

export interface CourseIdentifier {
    course_id: number,
    course_name: number,
    course_realm: string,
}

export interface Filter {
    id: number,
    positive: boolean,
    course_ids: CourseIdentifier[],
    user_id?: string
}

export const enum AlertType {
    Display = 0,
    Email = 1
}

export interface Alert {
    id: number;
    type: AlertType;
    event_id: string;
    timedelta: string;
}
