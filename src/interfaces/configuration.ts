import { IDashboardLink } from '@interfaces'

export interface IConfiguration {
    id: string
    title: string
    seoTitle: string
    seoMetaDescription: string
    subtext: string
    respondentsNounSingular: string
    respondentsNounPlural: string
    dashboardLinksFooter: IDashboardLink[]
    questionAsked: string
    showVideoLink: string
    aboutUs: string
}
