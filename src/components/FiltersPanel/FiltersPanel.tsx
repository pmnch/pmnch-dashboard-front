'use client'

import { Disclosure, Tab, Transition } from '@headlessui/react'
import { classNames, getDashboardConfig } from '@utils'
import { DashboardName } from '@enums'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { Box } from '@components/Box'
import Image from 'next/image'
import { getCampaignFilterOptions } from '@services/wra-dashboard-api'
import { Dashboard, Option } from '@types'
import { ICountryRegionOption, IFilterOptions } from '@interfaces'
import { Control, Controller, useForm, UseFormRegister, UseFormReturn } from 'react-hook-form'
import { SelectMultiValues } from '@components/SelectMultiValues'
import { SelectSingleValue } from '@components/SelectSingleValue'
import { Chevron } from '@components/Chevron'
import { IFiltersState, useFiltersStore } from '@stores/filters'
import { defaultFilterValues } from '@constants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Filter, filterSchema } from '@schemas/filter'
import { Stats } from '@components/FiltersPanel/Stats'
import { useTranslation } from '@app/i18n/client'
import { IFilterFormsState, useFilterFormsStore } from '@stores/filter-forms'
import { useQuery } from 'react-query'
import { Tooltip } from '@components/Tooltip'
import { IRefetchCampaignState, useRefetchCampaignStore } from '@stores/refetch-campaign'

interface IFiltersPanelProps {
    dashboard: Dashboard
    lang: string
}

interface IFieldProps {
    id: string
}

interface ISelectProps extends IFieldProps {
    dashboard: Dashboard
    options: (Option<string> | Option<boolean>)[]
    control: Control<Filter>
}

interface IInputProps extends IFieldProps {
    register: UseFormRegister<Filter>
}

export const FiltersPanel = ({ dashboard, lang }: IFiltersPanelProps) => {
    const setFilters = useFiltersStore((state: IFiltersState) => state.setFilters)
    const setForm1 = useFilterFormsStore((state: IFilterFormsState) => state.setForm1)
    const setForm2 = useFilterFormsStore((state: IFilterFormsState) => state.setForm2)
    const setRefetchCampaign = useRefetchCampaignStore((state: IRefetchCampaignState) => state.setRefetchCampaign)
    const { t } = useTranslation(lang)
    const config = getDashboardConfig(dashboard)

    // Select options
    const [countryOptions, setCountryOptions] = useState<Option<string>[]>([])
    const [responseTopicOptions, setResponseTopicOptions] = useState<Option<string>[]>([])
    const [ageOptions, setAgeOptions] = useState<Option<string>[]>([])
    const [genderOptions, setGenderOptions] = useState<Option<string>[]>([])
    const [professionOptions, setProfessionOptions] = useState<Option<string>[]>([])
    const [onlyResponsesFromCategoriesOptions, setOnlyResponsesFromCategoriesOptions] = useState<Option<boolean>[]>([])
    const [onlyMultiWordPhrasesContainingFilterTermOptions, setOnlyMultiWordPhrasesContainingFilterTermOptions] =
        useState<Option<boolean>[]>([])

    // Select regions options(s) for each filter
    const [regionOptionsFilter1, setRegionOptionsFilter1] = useState<Option<string>[]>([])
    const [regionOptionsFilter2, setRegionOptionsFilter2] = useState<Option<string>[]>([])

    // Region options for each country
    const [countriesRegionsOptions, setCountriesRegionsOptions] = useState<ICountryRegionOption[]>([])

    // Refetch campaign timeout
    const refetchCampaignTimeout = useRef<NodeJS.Timeout>()

    // Set default filter values for form
    let defaultFilterValuesForForm: Filter
    switch (dashboard) {
        case DashboardName.WWW_PAKISTAN:
            defaultFilterValuesForForm = { ...defaultFilterValues }
            defaultFilterValuesForForm.countries = ['PK']
            break
        case DashboardName.GIZ:
            defaultFilterValuesForForm = { ...defaultFilterValues }
            defaultFilterValuesForForm.countries = ['MX']
            break
        default:
            defaultFilterValuesForForm = defaultFilterValues
    }

    // Set display countries filter tooltip
    let displayCountriesFilterTooltip = true
    if (dashboard === DashboardName.WWW_PAKISTAN || dashboard === DashboardName.GIZ) {
        displayCountriesFilterTooltip = false
    }

    // Form 1
    const form1 = useForm<Filter>({
        defaultValues: defaultFilterValuesForForm,
        resolver: zodResolver(filterSchema),
    })
    useEffect(() => setForm1(form1), [setForm1, form1])

    // Form 2
    const form2 = useForm<Filter>({
        defaultValues: defaultFilterValuesForForm,
        resolver: zodResolver(filterSchema),
    })
    useEffect(() => setForm2(form2), [setForm2, form2])

    // Tabs
    const tabs = [
        { id: '1', title: t('drill-down'), form: form1 },
        { id: '2', title: `${t('compare-to')}...`, form: form2 },
    ]

    // Set selected tab classes
    let selectedTabClasses: string
    switch (dashboard) {
        case DashboardName.WHAT_YOUNG_PEOPLE_WANT:
            selectedTabClasses = 'border-t-pmnchColors-septenary'
            break
        default:
            selectedTabClasses = 'border-t-defaultColors-tertiary'
    }

    // Whether the PMNCH QR code should be displayed
    const displayPmnchQrCode = dashboard === DashboardName.WHAT_YOUNG_PEOPLE_WANT

    // Fetch filter options
    useQuery<IFilterOptions>({
        queryKey: [`campaign-filter-options-${dashboard}`],
        queryFn: () => getCampaignFilterOptions(config, lang),
        refetchOnWindowFocus: false,
        retry: 3,
        onSuccess: (filterOptions) => {
            // Country options
            setCountryOptions(filterOptions.countries)

            // Country Regions options
            setCountriesRegionsOptions(filterOptions.country_regions)

            // Response topic options
            setResponseTopicOptions(filterOptions.response_topics)

            // Age options
            setAgeOptions(filterOptions.ages)

            // Gender options
            setGenderOptions(filterOptions.genders)

            // Profession options
            setProfessionOptions(filterOptions.professions)

            // Only responses from categories options
            setOnlyResponsesFromCategoriesOptions(filterOptions.only_responses_from_categories)

            // Only multi-word phrases containing filter term options
            setOnlyMultiWordPhrasesContainingFilterTermOptions(
                filterOptions.only_multi_word_phrases_containing_filter_term
            )
        },
        onError: () => {},
    })

    // Set region options for filter
    const setRegionOptionsForFilter = useCallback(
        (
            selectedCountries: string[],
            setRegionOptionsFilter: Dispatch<SetStateAction<Option<string>[]>>,
            form: UseFormReturn<Filter, any>
        ) => {
            // Only display regions for 1 selected country
            if (selectedCountries.length !== 1) {
                setRegionOptionsFilter([])
                form.setValue('regions', [])
                return
            }

            // Set region options for selected country
            const countryRegionOptions = countriesRegionsOptions.find((countryRegionOption) => {
                return countryRegionOption.country_alpha2_code === selectedCountries[0]
            })
            if (countryRegionOptions) {
                setRegionOptionsFilter(countryRegionOptions.options)
            }
        },
        [countriesRegionsOptions]
    )

    // Set regions for the selected country for filter 1
    const watchCountriesForm1 = form1.watch('countries')
    useEffect(() => {
        setRegionOptionsForFilter(watchCountriesForm1, setRegionOptionsFilter1, form1)
    }, [watchCountriesForm1, form1, setRegionOptionsForFilter])

    // Set regions for the selected country for filter 2
    const watchCountriesForm2 = form2.watch('countries')
    useEffect(() => {
        setRegionOptionsForFilter(watchCountriesForm2, setRegionOptionsFilter2, form2)
    }, [watchCountriesForm2, form2, setRegionOptionsForFilter])

    // Cleanup refetch campaign timeout
    useEffect(() => {
        return () => {
            if (refetchCampaignTimeout.current) {
                clearTimeout(refetchCampaignTimeout.current)
            }
        }
    }, [refetchCampaignTimeout])

    // Set refetch campaign
    setRefetchCampaign(() => {
        // Clear the current refetch campaign timeout
        if (refetchCampaignTimeout.current) {
            clearTimeout(refetchCampaignTimeout.current)
        }

        // Add a small delay before refetching campaign
        refetchCampaignTimeout.current = setTimeout(() => {
            // Lowercase keyword_exclude and keyword_filter
            if (form1.getValues().keyword_exclude) {
                form1.getValues().keyword_exclude = form1.getValues().keyword_exclude.toLowerCase()
            }
            if (form1.getValues().keyword_filter) {
                form1.getValues().keyword_filter = form1.getValues().keyword_filter.toLowerCase()
            }

            // Lowercase keyword_exclude and keyword_filter
            if (form2.getValues().keyword_exclude) {
                form2.getValues().keyword_exclude = form2.getValues().keyword_exclude.toLowerCase()
            }
            if (form2.getValues().keyword_filter) {
                form2.getValues().keyword_filter = form2.getValues().keyword_filter.toLowerCase()
            }

            // Update the filters store (when filters are updated, useCampaignQuery will refetch campaign data)
            setFilters({ filter1: form1.getValues(), filter2: form2.getValues() })
        }, 450)
    })

    // Set select response topics text
    let selectResponseTopicsText: string
    switch (dashboard) {
        case DashboardName.WHAT_YOUNG_PEOPLE_WANT:
            selectResponseTopicsText = t('select-response-domains')
            break
        default:
            selectResponseTopicsText = t('select-response-topics')
    }

    return (
        <div>
            {/* Tooltip: filters */}
            <Tooltip
                id="filters-panel-tab-list"
                dashboard={dashboard}
                title={'Filter Controls'}
                paragraphs={[
                    'Here you can filter campaign responses.',
                    '“Select countries” and “Select response topics” are dropdowns that allow you to select from the list of participating countries and from the list of topic areas and categories.',
                ]}
            />

            {/* Tooltip: countries filter */}
            {displayCountriesFilterTooltip && (
                <Tooltip
                    id="filters-panel-select-country"
                    dashboard={dashboard}
                    title={'Filter by country'}
                    paragraphs={[
                        'Here you can filter responses by a particular country, or group of countries, by clicking on the country name in the dropdown.',
                        'You can also select a country by clicking on its bubble in the map view at the far bottom right of the Dashboard.',
                    ]}
                />
            )}

            {/* Tooltip: response topics */}
            <Tooltip
                id="filters-panel-select-response-topics"
                dashboard={dashboard}
                title={'Filter by Response Topic'}
                paragraphs={[
                    'Here you can drill down into the different categories of requests respondents demanded through the campaign.',
                    'You can select one or more topics by clicking on the category name in the dropdown.',
                    'You can also select a topic by clicking on its rectangle in the topic bar graph below.',
                ]}
            />

            {/* Tooltip: age */}
            <Tooltip
                id="filters-panel-select-age"
                dashboard={dashboard}
                title={'Filter by age'}
                paragraphs={[
                    'Use dropdowns to include only the ages you are filtering for.',
                    'You can also filter an age range by selecting specific bars on the age bar graph to the right.',
                ]}
            />

            {/* Tooltip: keyword */}
            <Tooltip
                id="filters-panel-input-keyword"
                dashboard={dashboard}
                title={'Filter by keywords'}
                paragraphs={[
                    'The “Filter by keyword” and “Exclude keyword” options allow for an even closer look at the responses by giving you the power to search for a specific keyword of your choosing.',
                ]}
            />

            {/* Tooltip: only multi-word phrases */}
            <Tooltip
                id="filters-panel-select-only-multi-word-phrases"
                dashboard={dashboard}
                title={'Advanced feature'}
                paragraphs={[
                    'To also see all the short phrases containing your chosen keyword term, select “Show only multi-word phrases containing the filter term.”',
                ]}
            />

            {/* Filters */}
            <div className="mb-5 w-full">
                <Box>
                    <Tab.Group>
                        <Tab.List data-tooltip-id="filters-panel-tab-list" className="mb-2 flex flex-col sm:flex-row">
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.id}
                                    className={({ selected }) =>
                                        classNames(
                                            'w-full bg-grayLighter py-5 leading-5 shadow-sm ring-transparent ring-offset-2 focus:outline-none',
                                            selected ? `border-t-2 bg-white ${selectedTabClasses}` : ''
                                        )
                                    }
                                >
                                    {tab.title}
                                </Tab>
                            ))}
                        </Tab.List>

                        <Tab.Panels>
                            {tabs.map(({ id, form }) => (
                                <Tab.Panel
                                    key={id}
                                    className="flex flex-col p-3 ring-transparent ring-offset-2 focus:outline-none"
                                    unmount={false}
                                >
                                    {/* Normal mode */}
                                    <div className="mb-5 flex flex-col gap-y-3">
                                        {/* Select countries */}
                                        <div data-tooltip-id="filters-panel-select-country">
                                            <div className="mb-1">{t('select-countries')}</div>
                                            <SelectCountries
                                                id={`select-countries-${id}`}
                                                dashboard={dashboard}
                                                options={countryOptions}
                                                control={form.control}
                                            />
                                        </div>

                                        {/* Select regions */}
                                        <div>
                                            <div className="mb-1">{t('select-regions')}</div>
                                            <SelectRegions
                                                id={`select-regions-${id}`}
                                                dashboard={dashboard}
                                                options={id === '1' ? regionOptionsFilter1 : regionOptionsFilter2}
                                                control={form.control}
                                            />
                                        </div>

                                        {/* Select response topics */}
                                        <div data-tooltip-id="filters-panel-select-response-topics">
                                            <div className="mb-1">{selectResponseTopicsText}</div>
                                            <SelectResponseTopics
                                                id={`select-response-topics-${id}`}
                                                dashboard={dashboard}
                                                options={responseTopicOptions}
                                                control={form.control}
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced mode */}
                                    <Disclosure as="div" className="flex flex-col justify-end">
                                        {({ open }) => (
                                            <>
                                                {/* Button to display advanced mode */}
                                                <Disclosure.Button className="flex items-center justify-end font-bold">
                                                    <span className="mr-2">{t('advanced-mode')}</span>
                                                    <span className="text-lg">
                                                        <Chevron direction="down" rotate={open} double={true} />
                                                    </span>
                                                </Disclosure.Button>

                                                {/* Advanced mode panel */}
                                                <Transition>
                                                    <Disclosure.Panel as="div" className="mt-5 flex flex-col gap-y-3">
                                                        {/* Show responses from categories */}
                                                        <div>
                                                            <div className="mb-1">{t('responses-from-categories')}</div>
                                                            <SelectOnlyResponsesFromCategories
                                                                id={`select-only-responses-from-categories-${id}`}
                                                                dashboard={dashboard}
                                                                options={onlyResponsesFromCategoriesOptions}
                                                                control={form.control}
                                                            />
                                                        </div>

                                                        {/* Filter by age */}
                                                        <div data-tooltip-id="filters-panel-select-age">
                                                            <div className="mb-1">
                                                                {t('filter-by-age-or-select-histogram')}
                                                            </div>
                                                            <SelectAges
                                                                id={`select-ages-${id}`}
                                                                dashboard={dashboard}
                                                                options={ageOptions}
                                                                control={form.control}
                                                            />
                                                        </div>

                                                        {/* For whatyoungpeoplewant show select gender */}
                                                        {dashboard === DashboardName.WHAT_YOUNG_PEOPLE_WANT && (
                                                            <>
                                                                {/* Filter by gender */}
                                                                <div className="flex gap-x-3">
                                                                    {/* Filter by gender */}
                                                                    <div className="flex basis-1/2 flex-col">
                                                                        <div className="mb-1">
                                                                            {t('filter-by-gender')}
                                                                        </div>
                                                                        <SelectGenders
                                                                            id={`select-genders-${id}`}
                                                                            dashboard={dashboard}
                                                                            options={genderOptions}
                                                                            control={form.control}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* For midwivesvoices show select gender and select profession */}
                                                        {dashboard === DashboardName.MIDWIVES_VOICES && (
                                                            <>
                                                                {/* Filter by gender & filter by profession */}
                                                                <div className="flex gap-x-3">
                                                                    {/* Filter by gender */}
                                                                    <div className="flex basis-1/2 flex-col justify-between">
                                                                        <div className="mb-1">
                                                                            {t('filter-by-gender')}
                                                                        </div>
                                                                        <SelectGenders
                                                                            id={`select-genders-${id}`}
                                                                            dashboard={dashboard}
                                                                            options={genderOptions}
                                                                            control={form.control}
                                                                        />
                                                                    </div>
                                                                    {/* Select profession */}
                                                                    <div className="flex basis-1/2 flex-col justify-between">
                                                                        <div className="mb-1">
                                                                            {t('select-profession')}
                                                                        </div>
                                                                        <SelectProfessions
                                                                            id={`select-professions-${id}`}
                                                                            dashboard={dashboard}
                                                                            options={professionOptions}
                                                                            control={form.control}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* Filter by keyword & exclude keyword */}
                                                        <div
                                                            className="flex gap-x-3"
                                                            data-tooltip-id="filters-panel-input-keyword"
                                                        >
                                                            {/* Filter by keyword */}
                                                            <div className="flex basis-1/2 flex-col">
                                                                <div className="mb-1">{t('filter-by-keyword')}</div>
                                                                <InputKeyword
                                                                    id={`input-keyword-${id}`}
                                                                    register={form.register}
                                                                />
                                                            </div>
                                                            {/* Exclude keyword */}
                                                            <div className="flex basis-1/2 flex-col">
                                                                <div className="mb-1">{t('exclude-keyword')}</div>
                                                                <InputExcludeKeyword
                                                                    id={`input-exclude-keyword-${id}`}
                                                                    register={form.register}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Show multi-word phrases */}
                                                        <div
                                                            className="flex flex-col"
                                                            data-tooltip-id="filters-panel-select-only-multi-word-phrases"
                                                        >
                                                            <div className="mb-1">{t('multi-word-phrases')}</div>
                                                            <SelectOnlyMultiWordPhrasesContainingFilterTerm
                                                                id={`select-only-multi-word-phrases-containing-filter-term-${id}`}
                                                                dashboard={dashboard}
                                                                options={
                                                                    onlyMultiWordPhrasesContainingFilterTermOptions
                                                                }
                                                                control={form.control}
                                                            />
                                                        </div>
                                                    </Disclosure.Panel>
                                                </Transition>
                                            </>
                                        )}
                                    </Disclosure>
                                </Tab.Panel>
                            ))}
                        </Tab.Panels>
                    </Tab.Group>
                </Box>
            </div>

            {/* Stats */}
            <Stats dashboard={dashboard} lang={lang} />

            {/* PMNCH QR code */}
            {displayPmnchQrCode && (
                <div className="flex flex-col items-center">
                    <Image
                        className="w-full max-w-[24rem] xl:max-w-[18rem]"
                        src="/whatyoungpeoplewant/pmnch_qr_code.png"
                        alt="PMNCH QR code"
                        width={1117}
                        height={200}
                    />
                    <div className="text-center font-1point8 text-4xl uppercase text-pmnchColors-primary">
                        {t('scan-share-be-heard')}
                    </div>
                </div>
            )}
        </div>
    )
}

const InputKeyword = ({ id, register }: IInputProps) => {
    return (
        <input
            id={id}
            type="text"
            className="w-0 min-w-full rounded-md border border-[#CCC] p-1.5"
            placeholder="Enter keyword..."
            {...register('keyword_filter')}
        />
    )
}

const InputExcludeKeyword = ({ id, register }: IInputProps) => {
    return (
        <input
            id={id}
            type="text"
            className="w-0 min-w-full rounded-md border border-[#CCC] p-1.5"
            placeholder="Enter keyword..."
            {...register('keyword_exclude')}
        />
    )
}

const SelectOnlyMultiWordPhrasesContainingFilterTerm = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="only_multi_word_phrases_containing_filter_term"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectSingleValue id={id} options={options} value={value} controllerRenderOnChange={onChange} />
            )}
        />
    )
}

const SelectProfessions = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="professions"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues id={id} options={options} controllerRenderOnChange={onChange} value={value} />
            )}
        />
    )
}

const SelectGenders = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="genders"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues id={id} options={options} controllerRenderOnChange={onChange} value={value} />
            )}
        />
    )
}

const SelectOnlyResponsesFromCategories = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="only_responses_from_categories"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectSingleValue id={id} options={options} value={value} controllerRenderOnChange={onChange} />
            )}
        />
    )
}

const SelectResponseTopics = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="response_topics"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues id={id} options={options} controllerRenderOnChange={onChange} value={value} />
            )}
        />
    )
}

const SelectRegions = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="regions"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues id={id} options={options} controllerRenderOnChange={onChange} value={value} />
            )}
        />
    )
}

const SelectCountries = ({ id, dashboard, options, control }: ISelectProps) => {
    // Set disabled
    let disabled = false
    if (dashboard === DashboardName.WWW_PAKISTAN || dashboard === DashboardName.GIZ) {
        disabled = true
    }

    return (
        <Controller
            name="countries"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues
                    id={id}
                    isDisabled={disabled}
                    options={options}
                    controllerRenderOnChange={onChange}
                    value={value}
                />
            )}
        />
    )
}

const SelectAges = ({ id, options, control }: ISelectProps) => {
    return (
        <Controller
            name="ages"
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectMultiValues id={id} options={options} controllerRenderOnChange={onChange} value={value} />
            )}
        />
    )
}
