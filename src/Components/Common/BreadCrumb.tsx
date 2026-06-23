import React from 'react';
import { Col, Row } from 'reactstrap';

interface BreadCrumbProps {
    title: string;
    children?: React.ReactNode;
}

const BreadCrumb = ({ title, children } : BreadCrumbProps) => {
    return (
        <React.Fragment>
            <Row className="sticky-breadcrumb">
                <Col xs={12}>
                    <div className="page-title-box d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
                        <h4 className="mb-0">{title}</h4>

                        {children && (
                            <div className="d-flex align-items-center gap-2 page-title-actions">
                                {children}
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default BreadCrumb;