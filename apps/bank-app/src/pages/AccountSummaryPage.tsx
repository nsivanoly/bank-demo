import React, { useEffect, useState } from "react";
import {
  Spinner,
  Alert,
  Card,
  Container,
  Row,
  Col,
  ListGroup,
  ProgressBar,
} from "react-bootstrap";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiGet } from "./api";
import { DefaultLayout } from "../layouts/default";

interface AccountSummary {
  totalAccounts: number;
  totalBalanceByCurrency: Record<string, number>;
  byType: Record<string, number>;
  // Added for enhancements
  growthPercentage?: number;
  topAccounts?: { name: string; balance: number; currency: string }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AccountSummaryPage: React.FC = () => {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'currency' | 'type'>('currency');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status, data } = await apiGet("/accounts/summary");
        if (status === 200) {
          // Add mock growth data for demo (replace with real data from API)
          setSummary({
            ...data,
            growthPercentage: 5.2,
            topAccounts: [
              { name: "Premium Savings", balance: 12500, currency: "USD" },
              { name: "Business Checking", balance: 8900, currency: "EUR" },
              { name: "Investment Account", balance: 7450, currency: "USD" }
            ]
          });
          setError(null);
        } else {
          setError("Failed to load summary data. Please try again later.");
        }
      } catch (err) {
        setError("Network error. Please check your connection.");
      }
      setLoading(false);
    })();
  }, []);

  const prepareChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const renderTotalAccountsCard = () => (
    <Card className="shadow border-0 h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
            <i className="bi bi-people-fill text-primary fs-2"></i>
          </div>
          <div>
            <Card.Title className="fw-semibold mb-0">Total Accounts</Card.Title>
            <span className="text-muted">All account types</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <p className="display-4 text-dark mb-1">{summary?.totalAccounts}</p>
          {summary?.growthPercentage && (
            <div className="d-flex align-items-center">
              <span className={`badge bg-${summary.growthPercentage >= 0 ? 'success' : 'danger'} me-2`}>
                {summary.growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(summary.growthPercentage)}%
              </span>
              <small className="text-muted">vs last month</small>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  const renderBalanceChart = () => {
    const data = prepareChartData(summary?.totalBalanceByCurrency || {});
    
    return (
      <Card className="shadow border-0 h-100">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <Card.Title className="fw-semibold mb-0">Balance Distribution</Card.Title>
              <span className="text-muted">By currency</span>
            </div>
            <div className="btn-group btn-group-sm">
              <button 
                className={`btn ${activeTab === 'currency' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('currency')}
              >
                Currency
              </button>
              <button 
                className={`btn ${activeTab === 'type' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('type')}
              >
                Type
              </button>
            </div>
          </div>
          
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'currency' ? (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()}`, 'Balance']}
                  />
                </PieChart>
              ) : (
                <BarChart data={prepareChartData(summary?.byType || {})}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Accounts']}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          
          <div className="mt-3">
            {data.map((item, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <span 
                  className="d-inline-block rounded-circle me-2" 
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                ></span>
                <span className="me-auto">{item.name}</span>
                <span className="fw-bold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderTopAccounts = () => (
    <Card className="shadow border-0 h-100">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
            <i className="bi bi-trophy-fill text-warning fs-2"></i>
          </div>
          <div>
            <Card.Title className="fw-semibold mb-0">Top Accounts</Card.Title>
            <span className="text-muted">Highest balances</span>
          </div>
        </div>
        
        <ListGroup variant="flush">
          {summary?.topAccounts?.map((account, index) => (
            <ListGroup.Item key={index} className="border-0 px-0 py-3">
              <div className="d-flex align-items-center">
                <span className="badge bg-primary me-3">{index + 1}</span>
                <div className="me-auto">
                  <div className="fw-semibold">{account.name}</div>
                  <small className="text-muted">{account.currency}</small>
                </div>
                <div className="text-end">
                  <div className="fw-bold">{account.balance.toLocaleString()}</div>
                  <ProgressBar 
                    now={(account.balance / (summary.topAccounts?.[0]?.balance || 1)) * 100} 
                    variant="warning" 
                    style={{ height: '4px' }} 
                  />
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );

  const renderQuickStats = () => (
    <Card className="shadow border-0">
      <Card.Body>
        <Row>
          {Object.entries(summary?.totalBalanceByCurrency || {}).map(([currency, amount], index) => (
            <Col key={index} md={4} className="mb-3 mb-md-0">
              <div className="d-flex align-items-center">
                <div className="bg-light rounded-circle p-3 me-3">
                  <i className={`bi bi-currency-${currency.toLowerCase()} fs-2 text-${index % 2 === 0 ? 'success' : 'info'}`}></i>
                </div>
                <div>
                  <h5 className="mb-0">{currency}</h5>
                  <p className="text-muted mb-0">Total balance</p>
                  <h3 className="mb-0">{amount.toLocaleString()}</h3>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );

  return (
    <DefaultLayout>
      <Container className="my-5">
        <div className="mb-5">
          <h2 className="fw-bold display-5 mb-2">
            Account Summary Dashboard
          </h2>
          <p className="text-muted fs-5">
            Comprehensive overview of all accounts and financial metrics
          </p>
        </div>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary" />
            <span className="visually-hidden">Loading...</span>
            <p className="mt-3">Gathering account data...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="text-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Oops!</strong> {error}
          </Alert>
        )}

        {!loading && !error && summary && (
          <>
            <Row className="mb-4">
              <Col>{renderQuickStats()}</Col>
            </Row>
            
            <Row className="g-4 mb-4">
              <Col lg={4}>{renderTotalAccountsCard()}</Col>
              <Col lg={8}>{renderBalanceChart()}</Col>
            </Row>
            
            <Row className="g-4">
              <Col lg={8}>
                <Card className="shadow border-0 h-100">
                  <Card.Body>
                    <Card.Title className="fw-semibold mb-3">Accounts by Type</Card.Title>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareChartData(summary.byType)}
                          layout="vertical"
                        >
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>{renderTopAccounts()}</Col>
            </Row>
          </>
        )}
      </Container>
    </DefaultLayout>
  );
};

export default AccountSummaryPage;
