import './App.css';
import React, { useState, useEffect } from 'react';
import BreakdownChart from './BreakdownChart';
import { Dropdown, Spinner, Container, Alert, Form, ProgressBar, ListGroup, Badge } from 'react-bootstrap';

import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import { BudgetBreakdownRecord } from './data.interface'
const axios = require('axios').default;

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
function displayAmount(amount: number) {
    let formatter = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    });

    return formatter.format(amount);
}

function filter(records: BudgetBreakdownRecord[], budgetNames: Set<string>) {
    return records.filter(ele => budgetNames.has(ele["name"]))
}

export const App: React.FC = () => {
    return <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
            <Route path="/" element={<InnerApp demo={false} />} />
            <Route path="/demo" element={<InnerApp demo={true} />} />
        </Routes>
    </BrowserRouter>
}

export const InnerApp: React.FC<{ demo: boolean }> = (props) => {
    const [year, setYear] = useState<number>(2022);
    const [month, setMonth] = useState<number>(1);
    const [dataset, setDataset] = useState<Map<number, BudgetBreakdownRecord[]>>(new Map());
    const [currentDataset, setCurrentDataset] = useState<BudgetBreakdownRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showAggregate, setShowAggregate] = useState<boolean>(false);
    const [monthList, setMonthList] = useState<number[]>(Array.from({ length: 12 }, (v, k) => k + 1));
    const [selectedBudget, setSelectedBudget] = useState<Set<string>>(new Set());
    const [demoMode, setDemoMode] = useState<boolean>(props.demo);
    const [loadError, setLoadError] = useState<string | null>(null);

    function loadData(year: number, reset: boolean = false) {
        let localDataSet = dataset

        if (reset) {
            localDataSet = new Map();
        }

        let loadedData = localDataSet.get(year);
        if (!loadedData) {
            setIsLoading(true);

            if (demoMode) {
                setTimeout(() => {
                    const loadedData = require(`./data/data.${year}.json`);
                    localDataSet.set(year, loadedData);
                    setIsLoading(false);
                    setDataset(localDataSet);
                    setCurrentDataset(localDataSet.get(year) as BudgetBreakdownRecord[]);
                    setLoadError(null);
                }, 1000);
            } else {
                const host = process.env.REACT_APP_API_HOST || `.`;
                axios.get(`${host}/budget_breakdown/${year}`).then((res: any) => {
                    const loadedData = res.data;
                    localDataSet.set(year, loadedData);
                    setIsLoading(false);
                    setDataset(localDataSet);
                    setCurrentDataset(localDataSet.get(year) as BudgetBreakdownRecord[]);
                    setLoadError(null);
                }).catch((err: Error) => {
                    console.error("Error while loading data: ", err.toString())
                    setIsLoading(false);
                    setDataset(localDataSet);
                    setCurrentDataset([]);
                    setLoadError(err.toString());
                });
            }

        } else {
            setIsLoading(false);
            setCurrentDataset(localDataSet.get(year) || []);
            setLoadError(null);
        }
    }

    function switchBudget(budgetName: string) {
        if (selectedBudget.has(budgetName)) {
            selectedBudget.delete(budgetName);
        } else {
            selectedBudget.add(budgetName);
        }
        setSelectedBudget(new Set(selectedBudget));
    }

    useEffect(() => {
        if (currentDataset) {
            let newSet = new Set(currentDataset.map(ele => ele.name));
            setSelectedBudget(newSet);
        }
    }, [currentDataset])

    useEffect(() => {

        loadData(year)
        const date = new Date();
        if (year === date.getFullYear()) {
            setMonthList(Array.from({ length: date.getMonth() + 1 }, (v, k) => k))
            setMonth(date.getMonth());
        } else {
            setMonthList(Array.from({ length: 12 }, (v, k) => k))
            setMonth(11);
        }

    }, [year])

    useEffect(() => {
        console.log("Switching demoMode to ", demoMode)
        loadData(year, true);
    }, [demoMode])


    return (
        <Container as="main" className='py-4'>
            <header className="pb-3 mb-4 border-bottom">
                <Link to="/" className="d-flex align-items-center text-dark text-decoration-none float-start"><h1 className='display-4'>📒 MoneyDashboard Report</h1></Link>

                <div className='float-end hstack gap-3'>
                    <Form.Switch inline
                        id="switch-demo"
                        label="Demo Mode"
                        checked={demoMode}
                        onChange={
                            (val: any) => {
                                setDemoMode(!demoMode);
                            }}
                    />
                    <Dropdown as="span">
                        <Dropdown.Toggle variant="dark" size="sm" id="dropdown-basic">
                            {year === 0 ? "Choose Year" : year}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {
                                Array.from({ length: 3 }, (v, k) => 2022 - k)
                                    .map((y: number) => <Dropdown.Item key={y} eventKey={y} onClick={() => setYear(y)}>{y}</Dropdown.Item>)
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown as="span">
                        <Dropdown.Toggle variant="dark" size="sm" id="dropdown-basic">
                            {monthLabels[month]}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {
                                monthList
                                    .map((m: number) => <Dropdown.Item key={m} eventKey={m} onClick={() => setMonth(m)}>{monthLabels[m]}</Dropdown.Item>)
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className="clearfix"></div>
            </header>

            <div className="h-100 px-1 py-3 p-md-5 mb-4 bg-light rounded-3 shadow">
                <h3 className='pb-3 border-bottom'>Annual Budget Summary</h3>
                {
                    isLoading
                        ?
                        <div className="align-middle" style={{ height: "calc(min(800px,100vh))" }}>
                            <Spinner animation="border" role="status" style={{ position: "relative", top: "50%", left: "50%" }}>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                        : loadError !== null ?
                            <Alert variant="danger">
                                <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                                <p>{loadError}</p>
                            </Alert>
                            :
                            <>
                                <div className="align-middle" style={{ height: "calc(min(800px,100vh))" }}>
                                    <BreakdownChart year={year} month={month} showCurrent={year === (new Date()).getFullYear()} showAggregate={showAggregate} value={filter(currentDataset, selectedBudget)} />
                                </div>
                                <div className='text-center'>

                                    <Form.Switch inline
                                        id="switch-aggregate"
                                        label="Aggregate Budgets"
                                        checked={showAggregate}
                                        onChange={
                                            (val: any) => {
                                                setShowAggregate(!showAggregate);
                                            }}
                                    />

                                </div>
                            </>
                }
            </div>

            <div className="row align-items-md-stretch">
                <div className="col-md-12 mb-4">
                    <div className="h-100 p-5 bg-light rounded-3 shadow">
                        <h3 className='pb-3 border-bottom'>Monthly Budget Summary</h3>

                        {
                            isLoading
                                ?
                                <div className="align-middle" >
                                    <Spinner animation="border" role="status" style={{ position: "relative", top: "50%", left: "50%" }}>
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                                :
                                <ListGroup>
                                    {
                                        currentDataset.map((ele, index) => {
                                            const overBudget = ele.monthlyAmount.GBP[month] > ele.monthlyBudget.amount
                                            const difference = ele.monthlyAmount.GBP[month] - ele.monthlyBudget.amount
                                            const percentage = ele.monthlyAmount.GBP[month] / ele.monthlyBudget.amount * 100
                                            const animated = selectedBudget.has(ele.name)
                                            const variant = percentage >= 100 ? "danger" : percentage > 90 ? "warning" : percentage > 80 ? "info" : "success"

                                            const labelElement =
                                                <Badge bg={variant} style={{ "width": 120 }}>{
                                                    percentage > 100
                                                        ? displayAmount(difference) + " Over"
                                                        : percentage == 100
                                                            ? "Hit Budget"
                                                            : displayAmount(-difference) + " Left"
                                                }
                                                </Badge>

                                            return <ListGroup.Item key={ele.name} action className='d-flex align-items-center'>

                                                <div className='float-start text-center' style={{ "width": 40 }}>
                                                    <Form.Switch
                                                        inline
                                                        id={`switch-budget-select-${index}`}
                                                        key={ele.name}
                                                        checked={selectedBudget.has(ele.name)}
                                                        onChange={() => switchBudget(ele.name)}
                                                    />
                                                </div>
                                                <div className='float-end ps-2' style={{ "width": "calc(100% - 40px)" }}>
                                                    <b>{ele.name} </b>
                                                    <small className='d-none d-md-inline-block'>({displayAmount(ele.monthlyAmount.GBP[month])})</small>
                                                    <span className='float-end d-none d-md-inline-block'>{labelElement}</span>
                                                    <div className="clearfix"></div>
                                                    <div className='pt-1'>
                                                        <ProgressBar style={{ "height": "8px" }} striped={animated} variant={variant} animated={animated} now={Math.min(100, percentage)} />
                                                    </div>
                                                </div>

                                            </ListGroup.Item>
                                        })
                                    }
                                </ListGroup>
                        }

                    </div>
                </div>
                {demoMode &&
                    <div className="col-md-12 mb-4">
                        <div className="h-100 p-5 bg-light border rounded-3 shadow">
                            <h3 className='pb-3 border-bottom'>Data</h3>
                            <dl className="row">
                                <dt className="col-sm-3">Year</dt>
                                <dd className="col-sm-9">{year}</dd>

                                <dt className="col-sm-3">Month</dt>
                                <dd className="col-sm-9">{monthLabels[month]}</dd>

                            </dl>
                            <Form.Control as="textarea" rows={30} value={JSON.stringify(currentDataset, null, 2)}
                                onChange={(v) => {
                                    v.preventDefault()
                                    try {
                                        const data = JSON.parse(v.target.value);
                                        setCurrentDataset(data);
                                    } catch (error) {
                                    }
                                }}
                            />
                        </div>
                    </div>
                }
            </div>

            <footer className="pt-3 mt-4 text-muted border-top">
                iLeoDo  &copy; 2022
            </footer>
            {/* </main>   */}
        </Container >
    );
}

export default App;