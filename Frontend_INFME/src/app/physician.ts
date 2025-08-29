export interface Alert {
  alertNumber: number;
  patientId: string;
  message: string[];
}

export interface Availability {
  dayOfWeek: string;
  from: string;
  to: string;
}

export interface UserRef {
  _id: string;
  name: string;
}

export interface Physician {
  _id: string;
  user: UserRef;
  specialty: string;
  phone: string;
  availability: Availability[];
  alerts: Alert[];
}