/**
 * Default layout containing a Header and Footer with content area.
 *
 * @returns {ReactElement}
 */
import React, { PropsWithChildren, ReactElement } from "react";
import Header from "../components/Header";
import { Footer } from "../components/Footer";

interface DefaultLayoutProps extends PropsWithChildren {
    isLoading?: boolean;
    hasErrors?: boolean;
}

export const DefaultLayout = ({ children, isLoading, hasErrors }: DefaultLayoutProps): ReactElement => {
    return (
        <>
            <Header />
            <main className="container">
                {isLoading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}
                {hasErrors && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        An authentication error occurred. Please try again.
                    </div>
                )}
                {!isLoading && children}
            </main>
            <Footer />
        </>
    );
};
