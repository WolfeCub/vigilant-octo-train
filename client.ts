import { Schedule, Order } from "./models";

export const getFreightSchedule = async (): Promise<Schedule[]> => {
    const response = await fetch('https://pauls-express-shipping.s3.us-east-1.amazonaws.com/PES_FreightSchedule.json');
    return await response.json();
};

export const getOrders = async (): Promise<Order[]> => {
    const response = await fetch('https://pauls-express-shipping.s3.us-east-1.amazonaws.com/PES_Ordes.json');
    const temp: Record<string, any>[] = await response.json();

    // Some provided data has extra whitespace. Ideally that wouldn't be there but this cleans that up.
    return temp.map((order) => {
        const trimmed = Object.entries(order).map(([k, v]) => [k.trim(), v]);
        return Object.fromEntries(trimmed);
    });
};
