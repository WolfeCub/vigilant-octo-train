export interface Schedule {
    DepartingLocation: string;
    ArrivalLocation: string;
    Day: number;
}

export type ScheduledFreight = Schedule & {
    LoadedOrders: Order[];
}

export interface Order {
    OrderNumber: number;
    Destination: string;
}
