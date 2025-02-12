import express, { Request, Response } from 'express';
import { getFreightSchedule, getOrders } from './client';
import { Schedule, ScheduledFreight } from './models';

const app = express();
const port = process.env.PORT || 3000;

const schedule = await getFreightSchedule();
const orders = await getOrders();

console.log(`Loaded ${schedule.length} transports and ${orders.length} orders`);

// Orders in the sample data come sorted but it's not a guarantee and we should be prioritizing by order number.
const ordersToSchedule = (await getOrders()).sort(o => o.OrderNumber);
const scheduledFreight: ScheduledFreight[] = schedule.map((s: Schedule) => ({ ...s, LoadedOrders: [] })).sort(s => s.Day);

app.get('/schedule', (_req: Request, res: Response) => {
    res.json(schedule);
});

app.get('/orders', (_req: Request, res: Response) => {
    res.json(orders);
});

app.get('/unloadedOrders', (_req: Request, res: Response) => {
    res.json(ordersToSchedule);
});

app.get('/scheduleOrders', (_req: Request, res: Response) => {
    let scheduledOrders = 0;

    // Orders and freights are already sorted in priority order so slotting into the first available slot should maintain priority
    for (const order of ordersToSchedule) {
        for (const freight of scheduledFreight) {
            if (freight.LoadedOrders.length >= 25) continue;

            // "All transports are able to deliver 25 orders and will start in Toronto" so no need to check the departing location
            if (freight.ArrivalLocation == order.Destination) {
                freight.LoadedOrders.push(order);
                ordersToSchedule.shift();
                scheduledOrders++;
                break;
            }
        }
    }

    res.json({
        scheduledOrders: scheduledOrders,
        remainingOrders: ordersToSchedule.length,
    });
});

// Not in the spec but useful for testing
app.get('/allTransports', (req: Request, res: Response) => {
    res.json(scheduledFreight);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

