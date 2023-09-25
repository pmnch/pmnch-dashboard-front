'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box } from '@components/Box'
import React, { useEffect } from 'react'
import { useTranslation } from '@app/i18n/client'
import { TOption } from '@types'
import { SelectSingleValue } from '@components/SelectSingleValue'
import {
    allCampaignsActiveDashboardSchema,
    TAllCampaignsActiveDashboard,
} from '@schemas/all-campaigns-active-dashboard'
import { DashboardName } from '@enums'
import { useActiveDashboardStore } from '@stores/active-dashboard'

interface ISelectActiveDashboardProps {
    lang: string
    options: TOption<string>[]
}

export const SelectActiveDashboard = ({ lang, options }: ISelectActiveDashboardProps) => {
    const { t } = useTranslation(lang)
    const setActiveDashboard = useActiveDashboardStore((state) => state.setActiveDashboard)

    // Form
    const form = useForm<TAllCampaignsActiveDashboard>({
        resolver: zodResolver(allCampaignsActiveDashboardSchema),
    })

    // Watch field
    const activeDashboardField = form.watch('active_dashboard')

    // Set default value for active_dashboard
    useEffect(() => {
        if (form) {
            form.setValue('active_dashboard', DashboardName.ALL_CAMPAIGNS)
        }
    }, [form])

    // Set active dashboard
    useEffect(() => {
        if (activeDashboardField) {
            setActiveDashboard(activeDashboardField)
        }
    }, [setActiveDashboard, activeDashboardField])

    // Set default value for active_dashboard
    useEffect(() => {
        if (form) {
            form.setValue('active_dashboard', DashboardName.ALL_CAMPAIGNS)
        }
    }, [form])

    return (
        <Box>
            <p className="font-bold">{t('select-dashboard')}:</p>

            {/* Select */}
            {options.length > 0 && (
                <div className="mt-3 w-full">
                    <Controller
                        name="active_dashboard"
                        control={form.control}
                        render={({ field: { onChange, value } }) => (
                            <SelectSingleValue
                                id="select-active-dashboard"
                                options={options}
                                value={value}
                                controllerRenderOnChange={onChange}
                            />
                        )}
                    />
                </div>
            )}
        </Box>
    )
}