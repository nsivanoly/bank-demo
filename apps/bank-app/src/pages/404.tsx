import React from "react";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../layouts/default";

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <DefaultLayout>
            <section className="py-5 my-5 bg-light text-center">
                <div className="container">
                    <div className="mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="100"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#2a52be"
                            strokeWidth="1.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V7a5 5 0 0110 0v3" />
                        </svg>
                    </div>
                    <h1 className="display-5 fw-bold text-danger">404: Page Not Found</h1>
                    <p className="lead text-muted">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                    <button
                        className="btn btn-primary rounded-pill px-4 py-2 mt-3"
                        onClick={() => navigate("/")}
                    >
                        Go Back to Home
                    </button>
                </div>
            </section>
        </DefaultLayout>
    );
};
