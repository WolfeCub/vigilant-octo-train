import express, { Request, Response } from 'express';
import { getFreightSchedule, getOrders } from './client';
import { Schedule, ScheduledFreight } from './models';

const app = express();
const port = process.env.PORT || 3000;

const schedule = await getFreightSchedule();
const orders = await getOrders();

const ordersToSchedule = await getOrders();
const scheduledFreight: ScheduledFreight[] = schedule.map((o: Schedule) => ({...o, LoadedOrders: []}));

app.get('/schedule', (req: Request, res: Response) => {
    res.json(schedule);
});

app.get('/orders', (req: Request, res: Response) => {
    res.json(orders);
});

app.get('/unloadedOrders', (req: Request, res: Response) => {
    res.json(ordersToSchedule);
});

app.get('/scheduleOrders', (req: Request, res: Response) => {
    let scheduledOrders = 0;
    for (const order of ordersToSchedule) {
        for (const freight of scheduledFreight) {
            if (freight.LoadedOrders.length >= 25) continue;

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

app.get('/allTransports', (req: Request, res: Response) => {
    res.json(scheduledFreight);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

