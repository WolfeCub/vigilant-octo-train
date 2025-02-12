import express, { Request, Response } from 'express';
import { getFreightSchedule, getOrders } from './client';
import { Schedule, ScheduledFreight, TransportOrdersRequest } from './models';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const schedule = await getFreightSchedule();
const orders = await getOrders();

console.log(`Loaded ${schedule.length} transports and ${orders.length} orders`);

// I've kept our list of orders and freights as close to the ingested data as possible.
// Any fields added to the ingested data should be simple to update as the models closely mirror the data we load in.

// Orders in the sample data come sorted but it's not a guarantee and we should be prioritizing by order number.
let ordersToSchedule = (await getOrders()).sort(o => o.OrderNumber);
let scheduledFreight: ScheduledFreight[] = schedule.map((s: Schedule) => ({ ...s, LoadedOrders: [] })).sort(s => s.Day);

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
    let unscheduledOrders = [];

    // To prevent recomputation at every loop interation.
    let len = ordersToSchedule.length;

    // Orders and freights are already sorted in priority order so slotting into the first available slot should maintain priority
    ordersLoop:
    for (let i = 0; i < len; i++) {
        const order = ordersToSchedule.shift();
        for (const freight of scheduledFreight) {
            // "All transports are able to deliver 25 orders and will start in Toronto" so no need to check the departing location
            if (freight.ArrivalLocation != order.Destination) continue;
            if (freight.LoadedOrders.length >= 25) continue;

            freight.LoadedOrders.push(order);
            scheduledOrders++;
            continue ordersLoop;
        }

        // If we can't schedule this order on any freight let's hang onto it for later.
        unscheduledOrders.push(order);
    }

    // Assumption: Any remaning orders will be slotted to be added to future scheduled freights.
    // Currently there's no method for loading & merging new freights but it would be straightforward to add.
    ordersToSchedule = unscheduledOrders;

    res.json({
        scheduledOrders: scheduledOrders,
        remainingOrders: unscheduledOrders.length,
    });
});

// Not in the spec but useful for testing
app.get('/allTransports', (_req: Request, res: Response) => {
    res.json(scheduledFreight);
});

app.get('/transportOrders', (req: Request<{}, {}, TransportOrdersRequest>, res: Response) => {
    // The function spec specifies returning all orders for a specific transport.
    // Currently the only way to specify a transport is by day and destination (all frieghts depart from Toronto).
    // Therefore we have no way of referencing a specific freight if there were to be more than one freight to a destination in a single day.
    // In the future we could return all freights on the day or change how freights are identified i.e. unique ids
    let freight = scheduledFreight.find(f => f.ArrivalLocation == req.body.ArrivalLocation && f.Day == req.body.Day);

    if (!freight)
        res.status(404)

    res.json(freight?.LoadedOrders ?? []);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

