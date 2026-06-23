import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'reactstrap';

interface BreadCrumbProps {
    title: string;
    pageTitle?: string;
    children?: React.ReactNode;
}

const BreadCrumb = ({ title, pageTitle, children } : BreadCrumbProps) => {
    const hasPageTitle = pageTitle && pageTitle.trim() !== '';

    return (
        <React.Fragment>
            <Row className="sticky-breadcrumb">
                <Col xs={12}>
                    <div className="page-title-box d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
                        <h4 className="mb-0">{title}</h4>

                        <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 flex-wrap flex-grow-1 flex-md-grow-0">
                            {children && (
                                <div className="d-flex align-items-center gap-2 page-title-actions">
                                    {children}
                                </div>
                            )}

                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    {hasPageTitle && (
                                        <li className="breadcrumb-item"><Link to="#">{pageTitle}</Link></li>
                                    )}
                                    <li className="breadcrumb-item active">{title}</li>
                                </ol>
                            </div>
                        </div>

                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default BreadCrumb;