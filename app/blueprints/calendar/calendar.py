from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict

import ics
from ics.alarm import DisplayAlarm, EmailAlarm, base
from ics.parse import ContentLine

from app.schoology.api import schoology_to_datetime
from app.view_utils import LocalizedTz

from .models import EventAlert, EventAlertType

class SchoologyCalendar:
    def __init__(self, creator: str, timezone: LocalizedTz,
                 events: List[Dict], alerts: List[EventAlert]):
        self.creator = creator
        self.timezone = timezone

        self.alerts = alerts
        self.events = SchoologyCalendar.sort_events(events)

    @property
    def ical(self) -> ics.Calendar:
        calendar = ics.Calendar(creator=self.creator, events=self.make_ical_events(self.events))

        calendar.extra.append(ContentLine(name="X-WR-CALNAME", value=self.creator))
        calendar.extra.append(ContentLine(name="X-WR-TIMEZONE", value=str(self.timezone)))
        calendar.extra.append(ContentLine(name="TZ", value="+00"))

        return calendar

    @staticmethod
    def sort_events(events: List[Dict]) -> List[Dict]:
        return list(sorted(sorted(events, key=SchoologyCalendar.start_distance),
                           key=SchoologyCalendar.event_length, reverse=True))

    @staticmethod
    def start_distance(event: Dict) -> timedelta:
        now = datetime.now()
        start_time = datetime.strptime(event['start'], '%Y-%m-%d %H:%M:%S')
        return start_time - now

    @staticmethod
    def event_length(event: Dict) -> timedelta:
        start_time = datetime.strptime(event['start'].split(' ')[0], '%Y-%m-%d')
        if event['has_end'] == 0:
            return timedelta()
        end_time = datetime.strptime(event['end'].split(' ')[0], '%Y-%m-%d')
        relative = end_time - start_time
        return relative

    @property
    def ical_alarms(self) -> Dict[int, List[base.BaseAlarm]]:
        alarms: Dict[int, List[base.BaseAlarm]] = defaultdict(list)

        for alert in self.alerts:
            # Invert timedelta to make it represent time before the event
            inverted_timedelta = -alert.timedelta
            # Alarms at the event's time break, so use the event's time - 1 microsecond
            if not inverted_timedelta:
                inverted_timedelta = timedelta(microseconds=-1)

            if alert.type == EventAlertType.EMAIL:
                alarm = EmailAlarm(inverted_timedelta)
            else:
                alarm = DisplayAlarm(inverted_timedelta)

            alarms[int(alert.event_id)].append(alarm)
        return alarms

    def make_ical_events(self, events: List[Dict]) -> List[ics.Event]:
        current_time = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        alarms = self.ical_alarms

        events_list = []
        for event in events:
            all_day = event['all_day'] == 1
            if len(event['end']) == 0:
                event['end'] = event['start']

            cal_event = ics.Event(
                event['title'],
                schoology_to_datetime(event['start'], self.timezone, all_day),
                schoology_to_datetime(event['end'], self.timezone, all_day),
                uid=str(event['id']),
                description=event['description'],
                alarms=alarms[event['id']]
            )
            cal_event.extra.append(ContentLine(name="DTSTAMP", value=current_time))

            if all_day:
                cal_event.make_all_day()

            events_list.append(cal_event)
        return events_list
