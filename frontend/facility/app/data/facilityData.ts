export interface BuildingOption {
  id: string;
  name: string;
  shortName: string;
}

export interface OccupantProfile {
  name: string;
  email: string;
  phone: string;
  building: string;
  flatNumber: string;
  residentType: string;
  notificationPreference: string;
}
