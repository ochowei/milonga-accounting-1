export interface TicketType {
  id: string;
  name: string;
  price: number;
  leaderCount: number;
  followerCount: number;
}

export interface AccountingRecord {
  id?: string;
  userId: string;
  date: string;
  eventName: string;
  generalPrice: number;
  studentPrice: number;
  leaderCount: number;
  followerCount: number;
  seasonPassCount: number;
  seasonPassLeaderCount: number;
  seasonPassFollowerCount: number;
  studentPassCount: number;
  ticketTypes?: TicketType[];
  cash1000: number;
  cash500: number;
  cash100: number;
  cash50: number;
  cash10: number;
  cash5: number;
  cash1: number;
  startingCash: number;
  expectedRevenue: number;
  actualCash: number;
  isBalanced: boolean;
}

export interface UserSettings {
  userId: string;
  defaultGeneralPrice: number;
  defaultStudentPrice: number;
}
