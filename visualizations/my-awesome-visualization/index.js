import React from 'react';
import PropTypes from 'prop-types';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from 'recharts';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer, LineChart, PlatformStateContext } from 'nr1';

export default class MyAwesomeVisualizationVisualization extends React.Component {
    // Custom props you wish to be configurable in the UI must also be defined in
    // the nr1.json file for the visualization. See docs for more details.
    static propTypes = {
        x: PropTypes.string,
        y: PropTypes.string,

        /**
         * An array of objects consisting of a nrql `query` and `accountId`.
         * This should be a standard prop for any NRQL based visualizations.
         */
        nrqlQueries: PropTypes.arrayOf(
            PropTypes.shape({
                accountId: PropTypes.number,
                query: PropTypes.string,
            })
        ),
    };

    /**
     * Restructure the data for a non-time-series, facet-based NRQL query into a
     * form accepted by the Recharts library's RadarChart.
     * (https://recharts.org/api/RadarChart).
     */
    transformData = (rawData, x, y, timeRange) => {
        let toreturn = rawData.map((entry) => ({
            ...entry,
            data: entry.data.map((d) => ({
                ...d,
                y: d[y],
                x: (new Date(d[x])).getTime()
            }))
        }));

        if (timeRange) {
            if (timeRange.duration) {
                const nowd = new Date();
                const sinceD = nowd.setMilliseconds(nowd.getMilliseconds() - timeRange.duration);

                return toreturn.map((entry) => ({
                    ...entry,
                    data: entry.data.filter((d) => d.x >= sinceD)
                }));
            } else {
                return toreturn.map((entry) => ({
                    ...entry,
                    data: entry.data.filter((d) => d.x >= timeRange.begin_time && d.x <= timeRange.end_time)
                }));
            }
        }
        return toreturn;
    };

    /**
     * Format the given axis tick's numeric value into a string for display.
     */
    formatTick = (value) => {
        return value.toLocaleString();
    };

    render() {
        const { nrqlQueries, x, y } = this.props;

        const nrqlQueryPropsAvailable =
            nrqlQueries &&
            nrqlQueries[0] &&
            nrqlQueries[0].accountId &&
            nrqlQueries[0].query;

        if (!nrqlQueryPropsAvailable) {
            return <EmptyState />;
        }

        return (
            <PlatformStateContext.Consumer>
                {(platformState) => (
                    <AutoSizer>
                        {({ width, height }) => (
                            <NrqlQuery
                                query={nrqlQueries[0].query}
                                accountId={parseInt(nrqlQueries[0].accountId)}
                                pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                            >
                                {({ data, loading, error }) => {
                                    console.log(platformState);

                                    if (loading) {
                                        return <Spinner />;
                                    }

                                    if (error) {
                                        return <ErrorState />;
                                    }

                                    const data3 = this.transformData(data, x, y, platformState.timeRange);

                                    return (
                                        <LineChart data={data3} fullWidth fullHeight />
                                    )
                                }}
                            </NrqlQuery>
                        )}
                    </AutoSizer>
                )}
            </PlatformStateContext.Consumer>

        );
    }
}

const EmptyState = () => (
    <Card className="EmptyState">
        <CardBody className="EmptyState-cardBody">
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Please provide at least one NRQL query & account ID pair
            </HeadingText>
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                type={HeadingText.TYPE.HEADING_4}
            >
                An example NRQL query you can try is:
            </HeadingText>
            <code>
                SELECT temp, datetimeStr from weatherHistory since 1 days ago limit max
            </code>
        </CardBody>
    </Card>
);

const ErrorState = () => (
    <Card className="ErrorState">
        <CardBody className="ErrorState-cardBody">
            <HeadingText
                className="ErrorState-headingText"
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Oops! Something went wrong.
            </HeadingText>
        </CardBody>
    </Card>
);
