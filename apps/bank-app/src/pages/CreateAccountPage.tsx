import React, { useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiPost } from "./api";
import { DefaultLayout } from "../layouts/default";

const initialFormData = {
  accountNumber: "",
  accountHolder: "",
  accountType: "",
  balance: "",
  currency: "",
  branch: "",
  ifscCode: "",
  status: "Active",
};

const validAccountTypes = ["Savings", "Current", "Business"];

const CreateAccountPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const { accountNumber, accountHolder, accountType, balance, currency, branch } = formData;

    if (!accountNumber.trim()) newErrors.accountNumber = "Account Number is required.";
    if (!accountHolder.trim()) newErrors.accountHolder = "Account Holder is required.";
    if (!validAccountTypes.includes(accountType)) newErrors.accountType = "Select a valid Account Type.";
    if (balance === "" || isNaN(Number(balance)) || Number(balance) < 0)
      newErrors.balance = "Balance must be a non-negative number.";
    if (!/^[A-Z]{3}$/.test(currency.trim().toUpperCase()))
      newErrors.currency = "Currency must be 3 uppercase letters.";
    if (!branch.trim()) newErrors.branch = "Branch is required.";

    return newErrors;
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      setIsSuccess(false);

      const validationErrors = validate();
      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return;
      }

      setErrors({});
      setLoading(true);

      try {
        const payload = {
          ...formData,
          balance: Number(formData.balance),
          currency: formData.currency.trim().toUpperCase(),
        };

        const { status, data } = await apiPost("/accounts", payload);

        if (status === 201 || status === 200) {
          setMessage(data?.message || "Account created successfully.");
          setIsSuccess(true);
          setFormData(initialFormData);
        } else {
          setMessage("Failed to create account. Please try again.");
        }
      } catch (error: any) {
        setMessage(error?.response?.data?.message || "Error creating account.");
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  return (
    <DefaultLayout>
      <Container className="my-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">
            <i className="bi bi-wallet2 me-3" style={{ fontSize: "2.5rem" }} />
            Create New Account
          </h2>
          <p className="text-muted fs-5">Fill the form below to add a new account</p>
        </div>

        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow border-0">
              <Card.Body>
                {message && (
                  <Alert
                    variant={isSuccess ? "success" : "danger"}
                    className="text-center d-flex align-items-center justify-content-center"
                  >
                    <i
                      className={`me-2 ${
                        isSuccess ? "fas fa-check-circle" : "fas fa-exclamation-triangle"
                      }`}
                    />
                    <strong>{isSuccess ? "Success:" : "Error:"}</strong>&nbsp;{message}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Row>
                    {[
                      {
                        label: "Account Number",
                        name: "accountNumber",
                        icon: "fas fa-hashtag",
                        type: "text",
                        placeholder: "Enter account number",
                      },
                      {
                        label: "Account Holder",
                        name: "accountHolder",
                        icon: "fas fa-user",
                        type: "text",
                        placeholder: "Enter account holder name",
                      },
                      {
                        label: "Initial Balance",
                        name: "balance",
                        icon: "fas fa-dollar-sign",
                        type: "number",
                        placeholder: "Enter initial balance",
                      },
                      {
                        label: "Currency (3-letter code)",
                        name: "currency",
                        icon: "fas fa-coins",
                        type: "text",
                        placeholder: "E.g., USD, EUR",
                      },
                      {
                        label: "Branch",
                        name: "branch",
                        icon: "fas fa-code-branch",
                        type: "text",
                        placeholder: "Enter branch name",
                      },
                      {
                        label: "IFSC Code (optional)",
                        name: "ifscCode",
                        icon: "fas fa-keyboard",
                        type: "text",
                        placeholder: "Enter IFSC code",
                      },
                    ].map(({ label, name, icon, type, placeholder }) => (
                      <Col md={6} key={name}>
                        <Form.Group className="mb-3" controlId={name}>
                          <Form.Label>{label}</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className={icon}></i>
                            </InputGroup.Text>
                            <Form.Control
                              type={type}
                              name={name}
                              value={(formData as any)[name]}
                              onChange={handleChange}
                              isInvalid={!!(errors as any)[name]}
                              placeholder={placeholder}
                            />
                            <Form.Control.Feedback type="invalid">
                              {(errors as any)[name]}
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    ))}

                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="accountType">
                        <Form.Label>Account Type</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="fas fa-list"></i>
                          </InputGroup.Text>
                          <Form.Select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleChange}
                            isInvalid={!!errors.accountType}
                          >
                            <option value="">Select type</option>
                            {validAccountTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.accountType}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4" controlId="status">
                        <Form.Label>Status</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="fas fa-toggle-on"></i>
                          </InputGroup.Text>
                          <Form.Select name="status" value={formData.status} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </Form.Select>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between align-items-center">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            className="me-2"
                          />
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus-circle me-2" /> Create Account
                        </>
                      )}
                    </Button>

                    <Button variant="secondary" onClick={() => navigate("/accounts")}>
                      <i className="fas fa-arrow-left me-2" /> Back to Accounts
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DefaultLayout>
  );
};

export default CreateAccountPage;
