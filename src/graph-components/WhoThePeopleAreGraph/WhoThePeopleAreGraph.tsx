'use client'

import { Box } from '@components/Box'
import { GraphTitle } from '@components/GraphTitle'
import { GraphError } from '@components/GraphError'
import { Loading } from 'components/Loading'
import { useCampaignQuery } from '@hooks/use-campaign-query'
import { SelectSingleValue } from '@components/SelectSingleValue'
import { TDashboard, TOption } from '@types'
import { Controller, useForm, UseFormReturn } from 'react-hook-form'
import React, { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod/dist/zod'
import { TWhoThePeopleAre, whoThePeopleAreSchema } from '@schemas/who-the-people-are'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from 'recharts'
import { DashboardName } from '@enums'
import { classNames, getDashboardConfig, niceNum, toThousandsSep } from '@utils'
import { IHistogramData } from '@interfaces'
import {
    getCampaignsMergedWhoThePeopleAreOptions,
    getCampaignWhoThePeopleAreOptions,
} from '@services/wra-dashboard-api'
import { useTranslation } from '@app/i18n/client'
import { useQuery } from 'react-query'
import { useFilterFormsStore } from '@stores/filter-forms'
import { useRefetchCampaignStore } from '@stores/refetch-campaign'
import { TFilter } from '@schemas/filter'
import { useCountriesStore } from '@stores/countries'

interface IWhoThePeopleAreGraphProps {
    dashboard: TDashboard
    lang: string
}

interface ICustomTooltip extends TooltipProps<number, string> {
    dashboard: TDashboard
    hoveredBarDataKey: MutableRefObject<string>
    showTooltip: boolean
    lang: string
}

export const WhoThePeopleAreGraph = ({ dashboard, lang }: IWhoThePeopleAreGraphProps) => {
    const { data, isError } = useCampaignQuery(dashboard, lang)
    const { t } = useTranslation(lang)
    const [currentHistogramData, setCurrentHistogramData] = useState<IHistogramData[]>([])
    const hoveredBarDataKey = useRef<string>(undefined as any)
    const [showTooltip, setShowTooltip] = useState<boolean>(false)
    const [paragraph, setParagraph] = useState<string>('')
    const [whoThePeopleAreOptions, setWhoThePeopleAreOptions] = useState<TOption<string>[]>([])
    const form1 = useFilterFormsStore((state) => state.form1)
    const form2 = useFilterFormsStore((state) => state.form2)
    const refetchCampaign = useRefetchCampaignStore((state) => state.refetchCampaign)
    const countries = useCountriesStore((state) => state.countries)
    const config = getDashboardConfig(dashboard)

    // Fetch options
    useQuery<TOption<string>[]>({
        queryKey: [`${dashboard}-who-the-people-are-filter-options`],
        queryFn: () => {
            if (dashboard === DashboardName.ALL_CAMPAIGNS) {
                return getCampaignsMergedWhoThePeopleAreOptions(lang)
            } else {
                return getCampaignWhoThePeopleAreOptions(config, lang)
            }
        },
        refetchOnWindowFocus: false,
        retry: 3,
        onSuccess: (options) => setWhoThePeopleAreOptions(options),
        onError: () => {},
    })

    // Form
    const form = useForm<TWhoThePeopleAre>({
        resolver: zodResolver(whoThePeopleAreSchema),
    })

    // Watch field
    const showBreakdownByField = form.watch('show_breakdown_by')

    // Set default value for show_breakdown_by
    useEffect(() => {
        if (form && whoThePeopleAreOptions.length > 0) {
            if (dashboard === DashboardName.HEALTHWELLBEING) {
                form.setValue('show_breakdown_by', 'breakdown-age-bucket')
            } else {
                form.setValue('show_breakdown_by', whoThePeopleAreOptions[0].value)
            }
        }
    }, [dashboard, form, whoThePeopleAreOptions])

    // Container height
    const containerHeight = useMemo(() => {
        if (!showBreakdownByField) return 0

        switch (showBreakdownByField) {
            case 'breakdown-age':
                if (dashboard === DashboardName.HEALTHWELLBEING) {
                    return 1900
                } else {
                    return 650
                }
            case 'breakdown-age-bucket':
                return 550
            case 'breakdown-gender':
                return 550
            default:
                return 1100
        }
    }, [dashboard, showBreakdownByField])

    // Set bars fill
    let bar1Fill: string
    let bar2Fill: string
    switch (dashboard) {
        case DashboardName.WHAT_YOUNG_PEOPLE_WANT:
            bar1Fill = 'var(--pmnchSecondary)'
            bar2Fill = 'var(--pmnchTertiary)'
            break
        default:
            bar1Fill = 'var(--defaultPrimary)'
            bar2Fill = 'var(--defaultTertiary)'
    }

    // Set bars classes
    let bar1Classes: string
    let bar2Classes: string
    switch (dashboard) {
        case DashboardName.WHAT_YOUNG_PEOPLE_WANT:
            bar1Classes = 'fill-pmnchColors-secondary hover:fill-pmnchColors-secondaryFaint'
            bar2Classes = 'fill-pmnchColors-tertiary hover:fill-pmnchColors-tertiaryFaint'
            break
        default:
            bar1Classes = 'fill-defaultColors-primary hover:fill-defaultColors-primaryFaint'
            bar2Classes = 'fill-defaultColors-tertiary hover:fill-defaultColors-tertiaryFaint'
    }

    // Set histogram data
    useEffect(() => {
        if (data && showBreakdownByField) {
            let histogramData: IHistogramData[]
            switch (showBreakdownByField) {
                case 'breakdown-age':
                    histogramData = data.histogram.ages
                    setParagraph(t('number-ages-respondents'))
                    break
                case 'breakdown-age-bucket':
                    if (dashboard === DashboardName.ALL_CAMPAIGNS) {
                        histogramData = data.histogram.age_buckets_default
                        setParagraph(t('number-ages-respondents'))
                    } else {
                        histogramData = data.histogram.age_buckets
                        setParagraph(t('number-ages-respondents'))
                    }
                    break
                case 'breakdown-gender':
                    histogramData = data.histogram.genders
                    setParagraph(t('number-ages-respondents'))
                    break
                case 'breakdown-profession':
                    histogramData = data.histogram.professions
                    setParagraph(t('number-ages-respondents'))
                    break
                case 'breakdown-country':
                    histogramData = data.histogram.canonical_countries
                    setParagraph(t('countries-respondents-located-in'))
                    break
                default:
                    histogramData = []
            }

            // Set count 2 values as negative
            for (const datum of histogramData) {
                datum.count_2 = -datum.count_2
            }

            setCurrentHistogramData(histogramData)
        }
    }, [data, showBreakdownByField, t])

    // Set form value on click
    function setValue(form: UseFormReturn<TFilter>, payload: IHistogramData) {
        // Set allow age bucket bar click
        let allowAgeBucketBarClick = false
        if (
            dashboard === DashboardName.WHAT_WOMEN_WANT ||
            dashboard === DashboardName.MIDWIVES_VOICES ||
            dashboard === DashboardName.ALL_CAMPAIGNS ||
            dashboard == DashboardName.HEALTHWELLBEING
        ) {
            allowAgeBucketBarClick = true
        }

        const value = payload.name
        let currentFormValues: string[] = []
        if (form) {
            switch (showBreakdownByField) {
                case 'breakdown-age':
                    currentFormValues = form.getValues('ages')
                    if (!currentFormValues.includes(value)) {
                        form.setValue('ages', [...currentFormValues, value])
                        if (refetchCampaign) refetchCampaign()
                    }

                    break
                case 'breakdown-age-bucket':
                    // Only allow clicking on age bucket bar for these dashboards
                    // These are the only dashboards currently with the option for filtering age buckets
                    if (allowAgeBucketBarClick) {
                        currentFormValues = form.getValues('age_buckets')
                        if (!currentFormValues.includes(value)) {
                            form.setValue('age_buckets', [...currentFormValues, value])
                            if (refetchCampaign) refetchCampaign()
                        }
                    }
                    break
                case 'breakdown-gender':
                    currentFormValues = form.getValues('genders')
                    if (!currentFormValues.includes(value)) {
                        form.setValue('genders', [...currentFormValues, value])
                        if (refetchCampaign) refetchCampaign()
                    }
                    break
                case 'breakdown-profession':
                    currentFormValues = form.getValues('professions')
                    if (!currentFormValues.includes(value)) {
                        form.setValue('professions', [...currentFormValues, value])
                        if (refetchCampaign) refetchCampaign()
                    }
                    break
                case 'breakdown-country':
                    // Get the alpha2 code of the country to add to the filter
                    const countryValue = countries.find((country) => country.name === value)?.alpha2code
                    currentFormValues = form.getValues('countries')
                    if (countryValue) {
                        if (!currentFormValues.includes(countryValue)) {
                            form.setValue('countries', [...currentFormValues, countryValue])
                            if (refetchCampaign) refetchCampaign()
                        }
                    }
                    break
            }
        }
    }

    // Format x-axis numbers
    function xAxisFormatter(item: number) {
        return toThousandsSep(Math.abs(item), lang).toString()
    }

    // Determine the max value for the x-axis
    const getMaxValueX = useMemo(() => {
        if (currentHistogramData.length < 1) return 0

        // Find the max value for count_1
        const count1Max = Math.abs(
            currentHistogramData.reduce((prev, curr) => (prev.count_1 > curr.count_1 ? prev : curr)).count_1
        )

        // Find the max value for count_2 (count_2 has negative numbers) and convert the number to positive
        const count2Max = Math.abs(
            currentHistogramData.reduce((prev, curr) => (prev.count_2 < curr.count_2 ? prev : curr)).count_2
        )

        return niceNum(Math.max(count1Max, count2Max), false)
    }, [currentHistogramData])

    // Legend formatter
    function legendFormatter(value: string) {
        if (data) {
            if (value === 'count_1') {
                return <span className="text-black">{data.filter_1_description}</span>
            }
            if (value === 'count_2') {
                return (
                    <span className="text-black">
                        {data.filter_2_description} ({t('normalized')})
                    </span>
                )
            }
        }

        return null
    }

    // Domain for x-axis
    const xAxisDomain = useMemo(() => {
        if (data) {
            if (data.filters_are_identical) {
                return [0, getMaxValueX]
            } else {
                return [-getMaxValueX, getMaxValueX]
            }
        }
    }, [data, getMaxValueX])

    // Set hovered bar data key
    function setHoveredBarDataKey(dataKey: string) {
        hoveredBarDataKey.current = dataKey
    }

    // Toggle showTooltip
    function toggleShowTooltip() {
        setShowTooltip((prev) => !prev)
    }

    // Display graph or not
    const displayGraph = !!data && !!currentHistogramData && !!showBreakdownByField

    return (
        <Box>
            <GraphTitle dashboard={dashboard} text={t('who-the-people-are')} />
            <p>{paragraph}</p>

            {/* Error */}
            {!data && isError && <GraphError dashboard={dashboard} />}

            {/* Loading (only at first data fetch) */}
            {!displayGraph && !isError && <Loading dashboard={dashboard} />}

            {/* Graph */}
            {displayGraph && (
                <div className="mt-3 flex flex-col">
                    {/* Select */}
                    <div className="w-full max-w-sm">
                        <Controller
                            name="show_breakdown_by"
                            control={form.control}
                            render={({ field: { onChange, value } }) => (
                                <SelectSingleValue
                                    id="select-show-breakdown-by"
                                    options={whoThePeopleAreOptions}
                                    value={value}
                                    controllerRenderOnChange={onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Bar chart */}
                    <div className="mb-3 mt-3 w-full">
                        <ResponsiveContainer height={containerHeight} className="bg-white">
                            <BarChart
                                data={currentHistogramData}
                                margin={{ top: 15, right: 35, left: 50, bottom: 15 }}
                                width={750}
                                layout="vertical"
                                barCategoryGap={5}
                                stackOffset="sign"
                            >
                                {/* Only display the legend if filters are not identical */}
                                {!data.filters_are_identical && (
                                    <Legend
                                        verticalAlign="top"
                                        formatter={(value) => legendFormatter(value)}
                                        wrapperStyle={{ paddingBottom: '1rem' }}
                                    />
                                )}
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    domain={xAxisDomain}
                                    tickFormatter={(item) => xAxisFormatter(item)}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={150}
                                    interval={0}
                                />
                                <CartesianGrid strokeDasharray="0" stroke="#FFFFFF" />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={
                                        <CustomTooltip
                                            dashboard={dashboard}
                                            hoveredBarDataKey={hoveredBarDataKey}
                                            showTooltip={showTooltip}
                                            lang={lang}
                                        />
                                    }
                                    position={{ x: 25 }}
                                />
                                {/* Only display bar2 if filters are not identical */}
                                {!data.filters_are_identical && (
                                    <Bar
                                        dataKey="count_2"
                                        className={bar2Classes}
                                        stackId={0}
                                        fill={bar2Fill}
                                        minPointSize={3}
                                        onMouseOver={() => setHoveredBarDataKey('count_2')}
                                        onMouseEnter={toggleShowTooltip}
                                        onMouseLeave={toggleShowTooltip}
                                        onClick={(payload) => {
                                            if (form2) setValue(form2, payload)
                                        }}
                                    />
                                )}

                                <Bar
                                    dataKey="count_1"
                                    className={bar1Classes}
                                    stackId={0}
                                    fill={bar1Fill}
                                    minPointSize={3}
                                    onMouseOver={() => setHoveredBarDataKey('count_1')}
                                    onMouseEnter={toggleShowTooltip}
                                    onMouseLeave={toggleShowTooltip}
                                    onClick={(payload) => {
                                        if (form1) setValue(form1, payload)
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </Box>
    )
}

const CustomTooltip = ({ active, payload, label, hoveredBarDataKey, showTooltip, lang }: ICustomTooltip) => {
    if (active && payload && payload.length) {
        const data = payload.find((data) => data.dataKey === hoveredBarDataKey.current)
        if (data) {
            const value = data.value ? Math.abs(data.value) : 0

            return (
                <p
                    className={classNames(`border border-white p-1 text-sm text-white`, showTooltip ? '' : 'hidden')}
                    style={{ backgroundColor: data.color }}
                >
                    {`${label}, ${toThousandsSep(value, lang)}`}
                </p>
            )
        }
    }

    return null
}
