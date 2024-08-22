import dayjs, { Dayjs } from "dayjs"
import { InvoiceSummary } from "../../api/Invoices"
import { Salesperson } from "../../api/Salespersons"
import { Customer } from "../../api/Customers"

export const calculateRevenueForToday = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    return invoiceSummaries
        .filter((summary) => {
            const date = dayjs(summary.createDatetime)
            return date.isSame(currentDate, 'day')
        })
        .reduce((acc, summary) => acc + (summary.overridenTotalAmount ?? summary.totalAmount), 0).toFixed(2)
}

export const calculateRevenueForCurrentMonth = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    return invoiceSummaries
        .filter((summary) => {
            const date = dayjs(summary.createDatetime)
            return date.isSame(currentDate, 'month')
        })
        .reduce((acc, summary) => acc + (summary.overridenTotalAmount ?? summary.totalAmount), 0).toFixed(2)
}

export const calculateNumberOfOrdersForToday = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    return invoiceSummaries
        .filter((summary) => {
            const date = dayjs(summary.createDatetime)
            return date.isSame(currentDate, 'day')
        }).length
}

export const calculateNumberOfOrdersForCurrentMonth = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    return invoiceSummaries
        .filter((summary) => {
            const date = dayjs(summary.createDatetime)
            return date.isSame(currentDate, 'month')
        }).length
}

export const daysXAxis = (
    currentDate: Dayjs
) => {
    const xAxis = []
    for (let index = 1; index <= currentDate.daysInMonth(); index++) {
        xAxis.push(index)
    }
    return xAxis
}

export const calculateDailyRevenue = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    const date = currentDate.date();
    const map = new Map<number, number>();

    invoiceSummaries.forEach((summary) => {
        const dayjsOfSummary = dayjs(summary.createDatetime)

        if (dayjsOfSummary.isSame(currentDate, 'year') && dayjsOfSummary.isSame(currentDate, 'month') && dayjsOfSummary.date() <= date) {
            if (!map.has(dayjsOfSummary.date())) {
                map.set(dayjsOfSummary.date(), summary.overridenTotalAmount ?? summary.totalAmount)
            } else {
                map.set(
                    dayjsOfSummary.date(),
                    map.get(dayjsOfSummary.date())! + (summary.overridenTotalAmount ?? summary.totalAmount)
                )
            }
        }
    });

    const result = []

    for (let index = 1; index <= date; index++) {
        var dailyRevenue = 0

        if (map.get(index) != undefined) {
            dailyRevenue += map.get(index)!
        }

        result.push(dailyRevenue)
    }

    return result;
}

export const calculateDailyOrders = (
    invoiceSummaries: InvoiceSummary[],
    currentDate: Dayjs
) => {
    const date = currentDate.date();
    const map = new Map<number, number>();

    invoiceSummaries.forEach((summary) => {
        const dayjsOfSummary = dayjs(summary.createDatetime)

        if (dayjsOfSummary.isSame(currentDate, 'year') && dayjsOfSummary.isSame(currentDate, 'month') && dayjsOfSummary.date() <= date) {
            if (!map.has(dayjsOfSummary.date())) {
                map.set(dayjsOfSummary.date(), 1)
            } else {
                map.set(
                    dayjsOfSummary.date(),
                    map.get(dayjsOfSummary.date())! + 1
                )
            }
        }
    });

    const result = []

    for (let index = 1; index <= date; index++) {
        var dailyOrders = 0

        if (map.get(index) != undefined) {
            dailyOrders += map.get(index)!
        }

        result.push(dailyOrders)
    }

    return result;
}

export const getCurrentMonthSalespersonRevenue = (
    invoiceSummaries: InvoiceSummary[],
    salespersons: Salesperson[],
    currentDate: Dayjs
) => {
    // Calculate the current month revenue for each salesperson
    const currentMonthRevenueForSalesperson = new Map<string, number>();
    salespersons.forEach((salesperson) => {
        currentMonthRevenueForSalesperson.set(salesperson.salespersonId, 0);
    });

    invoiceSummaries.forEach((summary) => {
        const date = dayjs(summary.createDatetime);
        if (date.isSame(currentDate, 'month')) {
            const salespersonId = summary.salespersonId;

            // If the salesperson is not found, skip
            if (!salespersons.find((salesperson) => salesperson.salespersonId === salespersonId)) {
                return;
            }

            const revenue = summary.overridenTotalAmount ?? summary.totalAmount;
            if (currentMonthRevenueForSalesperson.has(salespersonId)) {
                currentMonthRevenueForSalesperson.set(salespersonId, currentMonthRevenueForSalesperson.get(salespersonId)! + revenue);
            } else {
                currentMonthRevenueForSalesperson.set(salespersonId, revenue);
            }
        }
    });

    // Sort the salesperson by revenue
    const sortedSalespersons = salespersons.sort((a, b) => {
        // It is guaranteed that the salesperson is in the map, because we have set the value to 0 for all salespersons
        return currentMonthRevenueForSalesperson.get(b.salespersonId)! - currentMonthRevenueForSalesperson.get(a.salespersonId)!;
    });

    const dataset : {
        salespersonName: string
        revenue: number
    }[] = []

    sortedSalespersons.forEach((salesperson) => {
        dataset.push({
            salespersonName: salesperson.salespersonName,
            revenue: currentMonthRevenueForSalesperson.get(salesperson.salespersonId)!
        })
    })

    return dataset
}

export const getCurrentMonthCustomerRevenue = (
    invoiceSummaries: InvoiceSummary[],
    customers: Customer[],
    currentDate: Dayjs
) => {
    // Calculate the current month revenue for each customer
    const currentMonthRevenueForCustomer = new Map<string, number>();
    customers.forEach((customer) => {
        currentMonthRevenueForCustomer.set(customer.customerId, 0);
    });

    invoiceSummaries.forEach((summary) => {
        const date = dayjs(summary.createDatetime);
        if (date.isSame(currentDate, 'month')) {
            const customerId = summary.customerId;

            // If the customer is not found, skip
            if (!customers.find((customer) => customer.customerId === customerId)) {
                return;
            }

            const revenue = summary.overridenTotalAmount ?? summary.totalAmount;
            if (currentMonthRevenueForCustomer.has(customerId)) {
                currentMonthRevenueForCustomer.set(customerId, currentMonthRevenueForCustomer.get(customerId)! + revenue);
            } else {
                currentMonthRevenueForCustomer.set(customerId, revenue);
            }
        }
    });

    // Sort the customers by revenue
    const sortedCustomers = customers.sort((a, b) => {
        // It is guaranteed that the customer is in the map, because we have set the value to 0 for all customers
        return currentMonthRevenueForCustomer.get(b.customerId)! - currentMonthRevenueForCustomer.get(a.customerId)!;
    });

    const dataset : {
        customerName: string
        revenue: number
    }[] = []

    sortedCustomers.forEach((customer) => {
        dataset.push({
            customerName: customer.customerName,
            revenue: currentMonthRevenueForCustomer.get(customer.customerId)!
        })
    })

    return dataset
}

export const getCurrentMonthCustomerOrders = (
    invoiceSummaries: InvoiceSummary[],
    customers: Customer[],
    currentDate: Dayjs
) => {
    // Calculate the current month orders for each customer
    const currentMonthOrdersForCustomer = new Map<string, number>();
    customers.forEach((customer) => {
        currentMonthOrdersForCustomer.set(customer.customerId, 0);
    });

    invoiceSummaries.forEach((summary) => {
        const date = dayjs(summary.createDatetime);
        if (date.isSame(currentDate, 'month')) {
            const customerId = summary.customerId;

            // If the customer is not found, skip
            if (!customers.find((customer) => customer.customerId === customerId)) {
                return;
            }

            if (currentMonthOrdersForCustomer.has(customerId)) {
                currentMonthOrdersForCustomer.set(customerId, currentMonthOrdersForCustomer.get(customerId)! + 1);
            } else {
                currentMonthOrdersForCustomer.set(customerId, 1);
            }
        }
    });

    // Sort the customers by orders
    const sortedCustomers = customers.sort((a, b) => {
        // It is guaranteed that the customer is in the map, because we have set the value to 0 for all customers
        return currentMonthOrdersForCustomer.get(b.customerId)! - currentMonthOrdersForCustomer.get(a.customerId)!;
    });

    const dataset : {
        customerName: string
        orders: number
    }[] = []

    sortedCustomers.forEach((customer) => {
        dataset.push({
            customerName: customer.customerName,
            orders: currentMonthOrdersForCustomer.get(customer.customerId)!
        })
    })

    return dataset
}