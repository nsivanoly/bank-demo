import React, { useEffect, useState } from 'react';
import { 
  Spinner, 
  Alert, 
  Card, 
  Container, 
  Row, 
  Col, 
  Badge,
  Button,
  Table
} from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet } from './api';
import { DefaultLayout } from '../layouts/default';

interface Account {
  accountNumber: string;
  accountHolder: string;
  accountType: string;
  branch: string;
  balance: number;
  currency: string;
  ifscCode: string;
  createdDate: string;
  status: string;
  interestRate?: number;
  error?: string;
}

const AccountDetailCard = ({ 
  title, 
  value, 
  icon, 
  variant = 'primary',
  description 
}: {
  title: string;
  value: React.ReactNode;
  icon: string;
  variant?: string;
  description?: string;
}) => (
  <Card className="h-100 shadow-sm">
    <Card.Body className="d-flex flex-column">
      <div className="d-flex align-items-center mb-3">
        <div className={`bg-${variant}-subtle rounded-circle p-3 me-3`}>
          <i className={`bi ${icon} text-${variant} fs-3`}></i>
        </div>
        <div>
          <Card.Title className="mb-0">{title}</Card.Title>
          {description && <small className="text-muted">{description}</small>}
        </div>
      </div>
      <div className="mt-auto">
        <h3 className="mb-0">{value}</h3>
      </div>
    </Card.Body>
  </Card>
);

const ViewAccount = () => {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountNumber) {
      navigate('/accounts');
      return;
    }

    const fetchAccount = async () => {
      setLoading(true);
      try {
        const { status, data } = await apiGet(`/accounts/${encodeURIComponent(accountNumber)}`);
        if (status === 200) {
          setAccount({
            ...data,
            // Mock data for demo - replace with real API data
            interestRate: 1.5
          });
          setError(null);
        } else {
          setError(data.error || 'Account not found');
        }
      } catch (err) {
        setError('Failed to fetch account data. Please try again later.');
        console.error('Error fetching account:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountNumber, navigate]);

  if (loading) {
    return (
      <DefaultLayout>
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" role="status" />
          <p className="mt-3">Loading account details...</p>
        </Container>
      </DefaultLayout>
    );
  }

  if (error || !account) {
    return (
      <DefaultLayout>
        <Container className="my-5">
          <Alert variant="danger" className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <Alert.Heading>Error Loading Account</Alert.Heading>
              <p>{error}</p>
              <div className="d-flex justify-content-end">
                <Button variant="outline-danger" onClick={() => navigate('/accounts')}>
                  <i className="bi bi-arrow-left me-2"></i> Back to Accounts
                </Button>
              </div>
            </div>
          </Alert>
        </Container>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Container className="my-5">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="mb-1">
              <i className="bi bi-wallet2 me-3"></i>
              Account Details
            </h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/accounts">Accounts</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {account.accountNumber}
                </li>
              </ol>
            </nav>
          </div>
          <Badge bg={account.status === 'Active' ? 'success' : 'secondary'} className="fs-6">
            {account.status}
          </Badge>
        </div>

        {/* Quick Stats Row */}
        <Row className="g-4 mb-4">
          <Col md={12}>
            <AccountDetailCard
              title="Current Balance"
              value={<>{account.balance.toLocaleString()} <small className="text-muted">{account.currency}</small></>}
              icon="bi-cash-stack"
              variant="success"
            />
          </Col>
        </Row>

        {/* Account Details */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5 className="mb-4 fw-semibold text-primary">
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Account Information
                </h5>
                <dl className="row">
                  <dt className="col-sm-4">Account Holder</dt>
                  <dd className="col-sm-8">{account.accountHolder}</dd>

                  <dt className="col-sm-4">Account Type</dt>
                  <dd className="col-sm-8">
                    {account.accountType}
                    <Badge bg="light" text="dark" className="ms-2">
                      {account.currency}
                    </Badge>
                  </dd>

                  <dt className="col-sm-4">Created Date</dt>
                  <dd className="col-sm-8">{account.createdDate}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <h5 className="mb-4 fw-semibold text-primary">
                  <i className="bi bi-bank2 me-2"></i>
                  Branch Information
                </h5>
                <dl className="row">
                  <dt className="col-sm-4">Branch</dt>
                  <dd className="col-sm-8">{account.branch}</dd>

                  <dt className="col-sm-4">IFSC Code</dt>
                  <dd className="col-sm-8">
                    <code>{account.ifscCode}</code>
                  </dd>

                  <dt className="col-sm-4">Account Number</dt>
                  <dd className="col-sm-8">
                    <code>{account.accountNumber}</code>
                  </dd>
                </dl>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="d-flex justify-content-between mt-4">
          
          <div>
            <Button 
              variant="primary" 
              className="me-2"
              as={Link}
              to={`/accounts/${encodeURIComponent(account.accountNumber)}/edit`}
            >
              <i className="bi bi-pencil-square me-2"></i> Edit Account
            </Button>
            <Button variant="btn btn-secondary"
              as={Link}
              to={`/accounts`}
            >
              <i className="bi bi-arrow-left-circle me-2"></i> Back to Accounts
            </Button>
          </div>
        </div>
      </Container>
    </DefaultLayout>
  );
};

export default ViewAccount;
