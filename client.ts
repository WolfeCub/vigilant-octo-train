import { Schedule, Order } from "./models";

export const getFreightSchedule = async (): Promise<Schedule[]> => {
    const response = await fetch('https://pauls-express-shipping.s3.us-east-1.amazonaws.com/PES_FreightSchedule.json');
    return trimKeys<Schedule>(await response.json());
};

export const getOrders = async (): Promise<Order[]> => {
    const response = await fetch('https://pauls-express-shipping.s3.us-east-1.amazonaws.com/PES_Ordes.json');
    return trimKeys<Order>(await response.json());
};

// Some provided data has extra whitespace. Ideally that wouldn't be there but this cleans that up.
const trimKeys = <T>(body: Record<string, any>[]): T[] => {
    return body.map((x) => {
        const trimmed = Object.entries(x).map(([k, v]) => [k.trim(), v]);
        return Object.fromEntries(trimmed);
    });
};
