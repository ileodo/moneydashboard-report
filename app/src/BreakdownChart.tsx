import './App.css';
import React, { useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { MonthlyBudget, MonthlyAmount, BudgetBreakdownRecord, BudgetData, ChartData } from './data.interface'

// DEFINE
const TOTAL_X = 100;
const TOTAL_Y = 100;


const colorPalettes = [
    "#edae49",
    "#d1495b",
    "#00798c",
    "#30638e",
    "#003d5b",
    "#408e9a",
    "#80ded9",
    "#aeecef",
    "#bdadea",
    "#edae49",
    "#d1495b",
    "#00798c",
];


const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];


// HELPERS:

function round(number: number, precision: number) {
    const level = 10 ** precision;
    return Math.round((number + Number.EPSILON) * level) / level;
}

// function hexToRGB(hex: string, alpha: number): string {
//     var r = parseInt(hex.slice(1, 3), 16),
//         g = parseInt(hex.slice(3, 5), 16),
//         b = parseInt(hex.slice(5, 7), 16);

//     if (alpha) {
//         return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
//     } else {
//         return "rgb(" + r + ", " + g + ", " + b + ")";
//     }
// }

function displayAmount(amount: number) {
    let formatter = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    });

    return formatter.format(amount);
}


class DataProcessor {
    budgetBreakdowns: BudgetBreakdownRecord[];
    currency: string;
    TOTAL_X: number;
    TOTAL_Y: number;
    totalBudget: number;
    totalAmount: number;
    budgetNames: string[];

    constructor(budgetBreakdowns: BudgetBreakdownRecord[], currency: string = "GBP", TOTAL_X: number, TOTAL_Y: number) {
        this.budgetBreakdowns = budgetBreakdowns;
        this.currency = currency;
        this.TOTAL_X = TOTAL_X;
        this.TOTAL_Y = TOTAL_Y;

        this.totalBudget = this.budgetBreakdowns.reduce((acc: number, cur: any) => {
            return acc + cur.monthlyBudget.amount * 12
        }, 0);

        this.totalAmount = this.budgetBreakdowns.reduce((acc: number, cur: any) => {
            return acc + cur.monthlyAmount[this.currency].reduce((acc: number, cur: any) => {
                return acc + cur;
            }, 0);
        }, 0);

        this.budgetNames = this.budgetBreakdowns.reduce((acc: any, cur: any) => {
            if (!acc.includes(cur.name)) {
                acc.push(cur.name)
            }
            return acc;
        }, [])
    }

    getHighestY = () => {
        return this.budgetBreakdowns.reduce((acc: number, cur: any) => {
            const budgetAmount = cur.monthlyAmount[this.currency].reduce((acc: number, cur: any) => {
                return acc + cur;
            }, 0);

            const budgetWidth = cur.monthlyBudget.amount / (this.totalBudget / 12) * this.TOTAL_X;
            const height = (budgetAmount / this.totalBudget) * (this.TOTAL_X * this.TOTAL_Y) / budgetWidth;

            if (height > acc) {
                return height;
            } else {
                return acc;
            }
        }, 0);
    }

    getLowestY = () => {
        return this.budgetBreakdowns.reduce((acc: number, cur: any) => {
            const lowestAmount = cur.monthlyAmount[this.currency].reduce((acc: number[], cur: any) => {
                const currentAccumulatedAmount = acc[0] + cur;
                if (currentAccumulatedAmount < acc[1]) {
                    return [currentAccumulatedAmount, currentAccumulatedAmount]
                } else {
                    return [currentAccumulatedAmount, acc[1]]
                }
            }, [0, 0])[1];

            const budgetWidth = cur.monthlyBudget.amount / (this.totalBudget / 12) * this.TOTAL_X;
            const height = (lowestAmount / this.totalBudget) * (this.TOTAL_X * this.TOTAL_Y) / budgetWidth;

            if (height < acc) {
                return height;
            } else {
                return acc;
            }
        }, 0);
    }

    getBudgetData = (): BudgetData[] => {
        let budgetData: BudgetData[] = [];

        let xTrack = [0, 0] // [xStart, xLength]
        this.budgetBreakdowns.forEach((element: any) => {
            // assert(element.monthlyBudget.amount>=0);
            let data = new BudgetData();
            data.name = element.name;
            data.categories = element.categories;
            data.monthlyBudget = element.monthlyBudget.amount;

            data.xStart = xTrack[0] + xTrack[1];
            data.xLength = element.monthlyBudget.amount / (this.totalBudget / 12) * this.TOTAL_X;
            data.amount = element.monthlyAmount["GBP"].reduce((acc: number, cur: any) => {
                return acc + cur;
            }, 0);

            data.yStart = 0;
            data.yLength = this.TOTAL_Y;
            budgetData.push(Object.assign({}, data))
            xTrack = [data.xStart, data.xLength];
        });
        return budgetData;
    }

    getChartData = (): ChartData[] => {
        let chartData: ChartData[] = [];

        let xTrack = [0, 0] // [xStart, xLength]
        this.budgetBreakdowns.forEach((element: any) => {
            // assert(element.monthlyBudget.amount>=0);
            let data = new ChartData();
            data.name = element.name;
            data.categories = element.categories;
            data.monthlyBudget = element.monthlyBudget.amount;

            data.xStart = xTrack[0] + xTrack[1];
            data.xLength = element.monthlyBudget.amount / (this.totalBudget / 12) * this.TOTAL_X;
            xTrack = [data.xStart, data.xLength];
            let yTrack = [0, 0] // [yStart, yLength]
            for (let month = 0; month < element.monthlyAmount["GBP"].length; month++) {
                const monthlyAmount = element.monthlyAmount["GBP"][month];

                data.month = month;
                data.amount = monthlyAmount;

                data.yStart = yTrack[0] + yTrack[1];
                data.yLength = (monthlyAmount / this.totalBudget) * (this.TOTAL_X * this.TOTAL_Y) / data.xLength;
                yTrack = [data.yStart, data.yLength];
                chartData.push(Object.assign({}, data))
            }
        });
        return chartData;
    }

    getMontlyChartData = (): ChartData[][] => {
        const aggPerMonth = this.getChartData().reduce((aggPerMonth: any, cur: any) => {
            aggPerMonth[cur.month].push(cur);
            return aggPerMonth;
        }, Array.from(Array(12), () => new Array(0)));

        let yTrack = [0, 0] // [yStart, yLength]

        return aggPerMonth.map((element: any, index: number) => {
            const monthTotalBudget = element.reduce((acc: number, cur: any) => acc + cur.monthlyBudget, 0)
            const monthTotalAmount = element.reduce((acc: number, cur: any) => acc + cur.amount, 0)
            let monthTotalData: ChartData = new ChartData();
            monthTotalData.name = "";
            monthTotalData.categories = [];
            monthTotalData.monthlyBudget = monthTotalBudget;
            monthTotalData.xStart = 0;
            monthTotalData.xLength = this.TOTAL_X;
            monthTotalData.month = index;
            monthTotalData.amount = monthTotalAmount;
            monthTotalData.yStart = yTrack[0] + yTrack[1];
            monthTotalData.yLength = (monthTotalAmount / this.totalBudget) * (this.TOTAL_X * this.TOTAL_Y) / monthTotalData.xLength;
            yTrack = [monthTotalData.yStart, monthTotalData.yLength];
            return element.concat([Object.assign({}, monthTotalData)])
        });

    }


}


class ChartRenders {
    budgetNames: string[];
    totalBudget: number;
    TOTAL_X: number;
    TOTAL_Y: number;
    lowestY: number;
    constructor(budgetNames: string[], totalBudget: number, TOTAL_X: number, TOTAL_Y: number, lowestY: number) {
        this.budgetNames = budgetNames;
        this.totalBudget = totalBudget;
        this.TOTAL_X = TOTAL_X;
        this.TOTAL_Y = TOTAL_Y;
        this.lowestY = lowestY
    }

    renderBudgetLabel = (params: any, api: any) => {

        return {
            type: 'group',
            children: [
                this.renderBudgetBlock(params, api),
                this.renderBudgetText(params, api)
            ],

            focus: 'self',
            blurScope: 'series',
        }
    }

    renderBudgetText = (params: any, api: any) => {
        const start = api.coord([api.value('xStart'), 0]);
        const size = api.size([api.value('xLength'), 0]);
        return {
            type: 'text',
            x: start[0] + size[0] / 2,
            y:api.coord([0, Math.floor(this.lowestY / 25)*25])[1] + 30 ,
            rotation: -Math.PI / 2,
            style: {
                text: `${api.value('name')}`,
                textAlign: 'left',
                textVerticalAlign: 'middle'
            },
            blur: {
                style: {
                    text: `${api.value('name')}`,
                    textAlign: 'left',
                    textVerticalAlign: 'middle',
                    opacity: 1,
                }
            },
        }
    }

    renderBudgetBlock = (params: any, api: any) => {
        let fill = colorPalettes[this.budgetNames.indexOf(api.value('name'))%colorPalettes.length];
        const yValue = api.value('yLength');
        const y = yValue < 0 ? api.value('yStart') : yValue + api.value('yStart');
        const start = api.coord([api.value('xStart'), y]);
        const size = api.size([api.value('xLength'), Math.abs(yValue)]);

        let style: any = { fill: fill };
        if (yValue < 0) {
            style.fill = 'rgba(0, 0, 0, 0)'
            style.decal = {
                symbol: 'rect',
                dashArrayX: [2, 0],
                dashArrayY: [3, 5],
                rotation: -Math.PI / 4,
                color: fill,
            };
        }
        return {
            type: 'rect',
            shape: {
                x: start[0],
                y: start[1],
                width: size[0],
                height: size[1]
            },
            style: api.style(Object.assign(style, { opacity: 0.3 })),
            emphasis: {
                style: api.style(Object.assign(style, { opacity: 0.4 }))
            },
            blur: {
                style: api.style(Object.assign(style, { opacity: 0.2 }))
            },
            focus: 'self',
            blurScope: 'series',
        }
    }

    renderMonthLegend = (params: any, api: any) => {
        const month = api.value('month');
        const boxWidthPx = 30;
        const boxHeightVal = this.TOTAL_Y / 12;

        let monthSize = api.size([0, boxHeightVal]);
        let monthStart = api.coord([0, boxHeightVal * (month + 1)]);


        return {
            type: 'rect',
            id: `month-legend-${month}`,
            shape: {
                x: monthStart[0] - boxWidthPx,
                y: monthStart[1],
                width: boxWidthPx,
                height: monthSize[1]
            },
            style: { fill: '#444444', textFill: "#c7c7c7", fontWeight: "800", opacity: 0.8, text: `${monthLabels[month]}` },
            emphasis: {
                style: { fill: '#444444', textFill: "#c7c7c7", fontWeight: "800", opacity: 1, text: `${monthLabels[month]}` }
            },
            blur: {
                style: { fill: '#444444', textFill: "#ffffff", fontWeight: "800", opacity: 0.8, text: `${monthLabels[month]}` }
            },
            focus: 'series',
            morph: false,
        };
    }


    renderBlock = (params: any, api: any) => {

        let fill = colorPalettes[this.budgetNames.indexOf(api.value('name'))%colorPalettes.length];
        const yValue = api.value('yLength');
        const y = yValue < 0 ? api.value('yStart') : yValue + api.value('yStart');
        const start = api.coord([api.value('xStart'), y]);
        const size = api.size([api.value('xLength'), Math.abs(yValue)]);

        let style: any = { fill: fill };
        if (yValue < 0) {
            style.fill = 'rgba(0, 0, 0, 0)';
            style.decal = {
                symbol: 'rect',
                dashArrayX: [2, 0],
                dashArrayY: [3, 5],
                rotation: -Math.PI / 4,
                color: fill,
            };
        }
        return {
            type: 'rect',
            shape: {
                x: start[0],
                y: start[1],
                width: size[0],
                height: size[1]
            },
            style: style,
            // emphasis: {
            //     style: style
            // },
            // blur: {
            //     style: style,
            // },
            focus: 'self',
            // blurScope: 'series',
        }
    }

    renderMonthlyBlockHelper = (param: any, api: any) => {
        let fill = '#321';
        const month = api.value('month');
        const yValue = api.value('yLength');
        const y = yValue < 0 ? api.value('yStart') : yValue + api.value('yStart');
        const start = api.coord([api.value('xStart'), y]);
        const size = api.size([api.value('xLength'), Math.abs(yValue)]);

        let style: any = { fill: fill };
        if (yValue < 0) {
            style.fill = 'rgba(0, 0, 0, 0)';
            style.decal = {
                symbol: 'rect',
                dashArrayX: [2, 0],
                dashArrayY: [3, 5],
                rotation: -Math.PI / 4,
                color: fill,
            };
        }
        if (yValue === 0) {
            return
        }
        return {
            type: 'rect',
            shape: {
                x: start[0],
                y: start[1],
                width: size[0],
                height: size[1]
            },
            style: { fill: '#444444', textFill: "#c7c7c7", fontWeight: "800", opacity: 0.8, text: `${monthLabels[month]}` },
            emphasis: {
                style: { fill: '#444444', textFill: "#c7c7c7", opacity: 1, text: `${monthLabels[month]}` }
            },
            blur: {
                style: { fill: '#444444', textFill: "#ffffff", opacity: 0.8, text: `${monthLabels[month]}` }
            },
            focus: 'self',
            blurScope: 'global',
        }
    }

    renderMonthlyBlock = (param: any, api: any) => {
        if (api.value('name') == "") {
            return {
                type: 'group',
                children: [
                    this.renderMonthLegend(param, api),
                    this.renderMonthlyBlockHelper(param, api)
                ],
            }

        }

    }

    renderItemFunc = (param: any, api: any) => {

        if (api.value('name') === "") {
            return this.renderMonthLegend(param, api);
        }

        return this.renderBlock(param, api)

    }

    renderLine = (param: any, api: any) => {
        const h = api.value(0) / this.totalBudget * this.TOTAL_Y;
        const start = api.coord([0, h]);
        const end = api.coord([this.TOTAL_X, h]);
        return {
            type: 'line',
            transition: ['shape'],
            shape: {
                x1: start[0],
                x2: end[0],
                y1: start[1],
                y2: end[1]
            },
            style: {
                fill: null,
                stroke: api.visual('color'),
                lineWidth: 2
            },
        }
    }

}


interface BreakdownChartProps {
    year: number,
    month: number,
    showCurrent?: boolean,
    showAggregate: boolean,
    value: BudgetBreakdownRecord[]
}



const BreakdownChart: React.FC<BreakdownChartProps> = (props) => {
    const instance = useRef<ReactECharts>(null);
    const year: number = props.year;
    const month: number = props.month;
    const showCurrent: boolean = props.showCurrent as boolean;

    const budgetBreakdowns: BudgetBreakdownRecord[] = props.value;

    const dataProcessor = new DataProcessor(budgetBreakdowns, undefined, 100, 100);

    const totalBudget = dataProcessor.totalBudget;
    const totalAmount = dataProcessor.totalAmount;
    const highestY = Math.max(TOTAL_Y, dataProcessor.getHighestY());
    const lowestY = Math.min(0, dataProcessor.getLowestY());

    const budgetNames = dataProcessor.budgetNames;

    const budgetData: BudgetData[] = dataProcessor.getBudgetData();

    const chartRender = new ChartRenders(budgetNames, totalBudget, 100, 100, lowestY);

    // DATASETS
    const budgetDataSet = [
        {
            id: 24,
            dimensions: [
                { name: 'name', type: 'ordinal' },
                { name: 'categories', type: 'ordinal' },
                { name: 'monthlyBudget', type: 'float' },
                { name: 'amount', type: 'float' },
                { name: 'xStart', type: 'float' },
                { name: 'xLength', type: 'float' },
                { name: 'yStart', type: 'float' },
                { name: 'yLength', type: 'float' },
            ],
            source: budgetData
        }
    ];
    const chartDataGroupByMonth = dataProcessor.getMontlyChartData();

    const spendingDataSet = chartDataGroupByMonth.map((element: any, index: number) => {
        return {
            id: `breakdown-month-${index}`, //[0,11]
            dimensions: [
                { name: 'name', type: 'ordinal' },
                { name: 'categories', type: 'ordinal' },
                { name: 'monthlyBudget', type: 'float' },
                { name: 'xStart', type: 'float' },
                { name: 'xLength', type: 'float' },
                { name: 'month', type: 'ordinal' },
                { name: 'amount', type: 'float' },
                { name: 'yStart', type: 'float' },
                { name: 'yLength', type: 'float' },
            ],
            source: element
        }
    });

    const spendingAggregateDataSet = chartDataGroupByMonth.map((element: any, index: number) => {
        return {
            id: `aggregate-month-${index}`, //[0,11]
            dimensions: [
                { name: 'name', type: 'ordinal' },
                { name: 'categories', type: 'ordinal' },
                { name: 'monthlyBudget', type: 'float' },
                { name: 'xStart', type: 'float' },
                { name: 'xLength', type: 'float' },
                { name: 'month', type: 'ordinal' },
                { name: 'amount', type: 'float' },
                { name: 'yStart', type: 'float' },
                { name: 'yLength', type: 'float' },
            ],
            source: element.filter((element: any) => element.name === "")
        }
    });

    const seriesData = spendingDataSet.map((element: any, index: number) => {
        return {
            name: `${monthLabels[index]}`,
            id: `${monthLabels[index]}`,
            type: 'custom',// @ts-ignore
            renderItem: chartRender.renderItemFunc,
            encode: {
                itemId: 'month',
                x: ['xStart', 'xLength'],
                y: ['yStart', 'yLength'],
                tooltip: ['name', 'month', 'amount'],
                itemName: ['name', 'month'],
                itemGroupId: 'month',
            },
            tooltip: {
                formatter: function (params: any, ticket: string, callback: any) {
                    if (params.value.name === "") {
                        return `
                                <b>${monthLabels[params.value.month]}</b>  <hr/>
                                <div style="display: block">Monthly Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value.monthlyBudget)}</b></div>
                                <div style="display: block">Monthly Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value.amount)}</b></div>
                            `
                    } else {
                        return `
                                <b>${params.value.name}</b> <br/>
                                <b>${monthLabels[params.value.month]}</b> <hr/>
                                <div style="display: block">Monthly Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value.monthlyBudget)}</b></div>
                                <div style="display: block">Monthly Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value.amount)}</b></div>
                            `
                    }
                },
                textStyle: {
                    align: 'left',
                },
            },
            datasetIndex: index,
            zLevel: 20,
            z: 20,
            universalTransition: {
                enabled: true,
                delay: function (idx: any, count: any) {
                    return 100 + (index + 1) * 100;
                },
                divideShape: 'clone',
            },
        };
    })


    const seriesTotalBox = spendingAggregateDataSet.map((element: any, index: number) => {
        return {
            name: `${monthLabels[index]}`,
            id: `${monthLabels[index]}`,
            type: 'custom',// @ts-ignore
            renderItem: chartRender.renderMonthlyBlock,
            encode: {
                itemId: 'month',
                x: ['xStart', 'xLength'],
                y: ['yStart', 'yLength'],
                tooltip: ['name', 'month', 'amount'],
                itemName: ['name', 'month'],
                itemGroupId: 'month',
            },
            tooltip: {
                formatter: function (params: any, ticket: string, callback: any) {
                    if (params.value.name === "") {
                        return `
                                <b>${monthLabels[params.value.month]}</b>  <hr/>
                                <div style="display: block">Monthly Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value.monthlyBudget)}</b></div>
                                <div style="display: block">Monthly Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value.amount)}</b></div>
                            `
                    } else {
                    }
                },
                textStyle: {
                    align: 'left',
                },
            },
            datasetIndex: index + 12,
            zLevel: 30,
            z: 30,
            universalTransition: {
                enabled: true,
                delay: function (idx: any, count: any) {
                    return 100 + (index + 1) * 100;
                },
                divideShape: 'clone',
            }
        };
    })


    // Series: Total
    const seriesTotal = [{
        type: 'custom',
        name: 'total',
        id: 'total',
        renderItem: function (param: any, api: any) {
            const h = api.value(0) / totalBudget * TOTAL_Y;
            const start = api.coord([0, h]);
            const end = api.coord([TOTAL_X, h]);
            return {
                type: 'line',
                transition: ['shape'],
                shape: {
                    x1: start[0],
                    x2: end[0],
                    y1: start[1],
                    y2: end[1]
                },
                style: {
                    fill: null,
                    stroke: "#e43",
                    lineWidth: 2
                },
            }
        },
        zLevel: 40,
        z: 40,
        tooltip: {
            formatter: function (params: any, ticket: string, callback: any) {
                return `
                        <b>Total</b> <hr/>
                        <div style="display: block">Annual Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value[0])}</b></div>
                        <div style="display: block">Annual Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value[1])}</b></div>
                        <div style="display: block">Left to Spend: <b style="float: right; margin-left:10px">${displayAmount(params.value[0] - params.value[1])}</b></div>
                    `
            },
            textStyle: {
                align: 'left',
            },
        },
        data: [[totalBudget, totalAmount]],
    }];

    // Series: Total
    const seriesCurrent = [{
        type: 'custom',
        name: 'current',
        id: 'current',
        renderItem: function (param: any, api: any) {
            const h = api.value(0) / totalBudget * TOTAL_Y;
            const start = api.coord([0, h]);
            const end = api.coord([TOTAL_X, h]);
            return {
                type: 'line',
                transition: ['shape'],
                shape: {
                    x1: start[0],
                    x2: end[0],
                    y1: start[1],
                    y2: end[1]
                },
                style: {
                    fill: null,
                    stroke: "#e71",
                    lineWidth: 2
                },
            }
        },
        zLevel: 40,
        z: 40,
        tooltip: {
            formatter: function (params: any, ticket: string, callback: any) {
                return `
                            <b>Current</b> <hr/>
                            <div style="display: block">Current Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value[0])}</b></div>
                            <div style="display: block">Current Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value[1])}</b></div>
                            <div style="display: block">Left to Spend: <b style="float: right; margin-left:10px">${displayAmount(params.value[0] - params.value[1])}</b></div>
                        `
            },
            textStyle: {
                align: 'left',
            },
        },
        data: [[totalBudget / 12 * (props.month + 1), totalAmount]],
    }];


    const seriesBudgetLabels = [{
        type: 'custom',
        name: 'budgetLabels',
        id: 'budgetLabels',
        renderItem: chartRender.renderBudgetLabel,
        encode: {
            x: ['xStart', 'xLength'],
            y: ['amount'],
            tooltip: ['name'],
            itemName: ['name']
        },
        tooltip: {
            formatter: function (params: any, ticket: string, callback: any) {
                return `
                            <b>${params.value.name}</b> 
                            <ul style="padding-inline-start: 20px;">${params.value.categories.map(
                    (ele: any) => {
                        return `<li>${ele}</li>`
                    }).join("")}</ul><hr/>
                            <div style="display: block">Annual Budget: <b style="float: right; margin-left:10px">${displayAmount(params.value.monthlyBudget * 12)}</b></div>
                            <div style="display: block">Annual Amount: <b style="float: right; margin-left:10px">${displayAmount(params.value.amount)}</b></div>
                            <div style="display: block">Left to Spend: <b style="float: right; margin-left:10px">${displayAmount(params.value.monthlyBudget * 12 - params.value.amount)}</b></div>
                        `
            },
            textStyle: {
                align: 'left',
            },
        },
        datasetIndex: 24,
        zLevel: 10,
        z: 10
    }]


    function getSeries(aggregate: boolean, current: boolean) {
        let series: any[] = [seriesBudgetLabels, seriesTotal];
        if (aggregate) {
            series.push(seriesTotalBox)
        } else {
            series.push(seriesData);

        }
        if (current) {
            series.push(seriesCurrent)
        }
        return series;
    }


    let series = getSeries(props.showAggregate, props.showCurrent as boolean);
    const option = {
        title: {
            show: false,
        },
        grid: {
            left: 30,
            right: 0,
            top: 10,
            bottom: 140,
            containLabel: true,
        },
        aria: {
            enabled: true,
            decal: {
                show: true
            }
        },
        tooltip: {
            trigger: 'item',
        },
        dataset: [spendingDataSet, spendingAggregateDataSet, budgetDataSet].flat(),
        xAxis: {
            min: 0,
            max: TOTAL_X,
            show: true,
            splitNumber: 5,
            axisLabel: {
                show: true,// @ts-ignore
                formatter: function (value, index) {
                    return `${value}%`;
                },
            },
            axisLine: {
                show: true,
            },
        },
        yAxis: [
            {
                min: Math.floor(lowestY / 25) * 25,
                max: Math.ceil(highestY / 25) * 25,
                interval: TOTAL_Y / 12,
                splitNumber: 12,
                position: 'left',
                axisLabel: {
                    show: false,
                },
                axisLine: {
                    lineStyle: {}
                },
                axisTick: {
                    show: false
                }
            },
            {
                min: Math.floor(lowestY / 25) * 25,
                max: Math.ceil(highestY / 25) * 25,
                interval: TOTAL_Y / 12,
                splitNumber: 12,
                position: 'right',
                axisLabel: {
                    show: true,// @ts-ignore
                    formatter: function (value, index) {
                        const rounded = round(value, 2);
                        if (rounded % 25 !== 0) {
                            return ``;
                        }
                        // return [''].concat(monthLabels)[index];
                        return `${round(value, 2)}%`;
                    },
                },
                axisLine: {
                    lineStyle: {}
                },
                axisTick: {
                    inside: false,
                }
            }],
        series: series.flat(),
    };

    useEffect(() => {
        console.log("props.showAggregate Changed", props.showAggregate, props.showCurrent);
        // @ts-ignore
        let ins = instance.current.getEchartsInstance();
        let series = getSeries(props.showAggregate, props.showCurrent as boolean);
        ins.setOption({
            series: series.flat(),
        }, {
            replaceMerge: ['series'],
        });
    }, [props.showAggregate, props.showCurrent])

    return <ReactECharts ref={instance} option={option} style={{ height: "100%" }} />;

}

BreakdownChart.defaultProps = {
    showCurrent: false,
};
export default BreakdownChart;
