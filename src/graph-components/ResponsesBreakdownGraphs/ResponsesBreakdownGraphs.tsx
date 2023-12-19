'use client'

import { Box } from '@components/Box'
import { GraphTitle } from '@components/GraphTitle'
import { LegacyDashboardName } from '@enums'
import { useCampaignQuery } from '@hooks/use-campaign-query'
import { Loading } from 'components/Loading'
import { GraphError } from 'components/GraphError'
import { useTranslation } from '@app/i18n/client'
import React, { useContext } from 'react'
import { Tooltip } from '@components/Tooltip'
import { ResponsesBreakdownGraph } from '@graph-components/ResponsesBreakdownGraphs/ResponsesBrekadownGraph'
import { ParamsContext } from '@contexts/params'

export const ResponsesBreakdownGraphs = () => {
    const { params } = useContext(ParamsContext)
    const { dashboard, lang, config } = params

    const { data, isError, isLoading, isRefetching } = useCampaignQuery()
    const { t } = useTranslation(lang)

    // Set breakdown responses topic text
    let breakdownResponsesTopicText: string
    switch (dashboard) {
        case LegacyDashboardName.WHAT_WOMEN_WANT:
            breakdownResponsesTopicText = t(`${config.campaign_code}-breakdown-responses-topic`)
            break
        case LegacyDashboardName.WHAT_YOUNG_PEOPLE_WANT:
            breakdownResponsesTopicText = t(`${config.campaign_code}-breakdown-responses-topic`)
            break
        case LegacyDashboardName.ECONOMIC_EMPOWERMENT_MEXICO:
            breakdownResponsesTopicText = t(`${config.campaign_code}-breakdown-responses-topic`)
            break
        default:
            breakdownResponsesTopicText = t('breakdown-responses-topic')
    }

    // Set click view topic responses text
    let clickViewTopicResponsesText: string
    switch (dashboard) {
        case LegacyDashboardName.WHAT_WOMEN_WANT:
            clickViewTopicResponsesText = t(`${config.campaign_code}-click-view-topic-responses`)
            break
        default:
            clickViewTopicResponsesText = t('click-view-topic-responses')
    }

    // Set can display categories
    let canDisplayParentOrSubCategories: boolean
    let canDisplayParentCategories: boolean
    let canDisplaySubCategories: boolean
    switch (dashboard) {
        case LegacyDashboardName.WHAT_WOMEN_WANT_PAKISTAN:
            canDisplayParentOrSubCategories = true
            canDisplayParentCategories = false
            canDisplaySubCategories = false
            break
        default:
            canDisplayParentOrSubCategories = false
            canDisplayParentCategories = true
            canDisplaySubCategories = true
    }

    const displayGraphs = !!data && !isLoading && !isRefetching

    // Nothing to show
    if (
        data &&
        !data?.responses_breakdown?.parent_categories?.length &&
        !data?.responses_breakdown?.sub_categories?.length &&
        !data?.responses_breakdown?.parent_or_sub_categories?.length
    ) {
        return null
    }

    // Set show title
    let showTitle = false
    if (data?.responses_breakdown?.parent_categories?.length && data?.responses_breakdown?.sub_categories?.length) {
        showTitle = true
    }

    return (
        <div>
            {/* Tooltip: responses breakdown */}
            <Tooltip
                id="responses-breakdown"
                dashboard={dashboard}
                title={'Topic breakdown'}
                paragraphs={[
                    'Each topic category is represented as a bar. The length of the bar represents how many respondents responded in that category.',
                    'You can click on a topic bar to filter for that category.',
                ]}
            />

            <Box>
                <div data-tooltip-id="responses-breakdown">
                    <GraphTitle dashboard={dashboard} text={breakdownResponsesTopicText} />
                </div>
                <p>{clickViewTopicResponsesText}</p>

                {/* Error */}
                {!data && isError && <GraphError dashboard={dashboard} />}

                {/* Loading */}
                {!displayGraphs && !isError && <Loading dashboard={dashboard} />}

                {/* GraphsWrapper */}
                {displayGraphs && (
                    <div>
                        {/* Parent or sub-categories */}
                        {canDisplayParentOrSubCategories &&
                            data &&
                            data.responses_breakdown.parent_or_sub_categories.length > 0 && (
                                <ResponsesBreakdownGraph
                                    data={data.responses_breakdown.parent_or_sub_categories}
                                    filtersAreIdentical={data.filters_are_identical}
                                    filter1Description={data.filter_1_description}
                                    filter2Description={data.filter_2_description}
                                    title=""
                                    type="parent_or_sub"
                                />
                            )}

                        {/* Parent categories */}
                        {canDisplayParentCategories &&
                            data &&
                            data.responses_breakdown.parent_categories.length > 0 && (
                                <ResponsesBreakdownGraph
                                    data={data.responses_breakdown.parent_categories}
                                    filtersAreIdentical={data.filters_are_identical}
                                    filter1Description={data.filter_1_description}
                                    filter2Description={data.filter_2_description}
                                    title={showTitle ? t('categories') : ''}
                                    type="parent"
                                />
                            )}

                        {/* Sub-categories */}
                        {canDisplaySubCategories && data && data.responses_breakdown.sub_categories.length > 0 && (
                            <ResponsesBreakdownGraph
                                data={data.responses_breakdown.sub_categories}
                                filtersAreIdentical={data.filters_are_identical}
                                filter1Description={data.filter_1_description}
                                filter2Description={data.filter_2_description}
                                title={showTitle ? t('subcategories') : ''}
                                type="sub"
                            />
                        )}
                    </div>
                )}
            </Box>
        </div>
    )
}
