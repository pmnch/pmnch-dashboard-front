import { IConfiguration } from '@interfaces'
import { seoMainTitle } from '@constants'
import { DashboardName } from '@enums'

const title = 'Women’s Health and Well Being'

export const configuration: IConfiguration = {
    id: DashboardName.HEALTHWELLBEING,
    title: title,
    campaignCode: 'healthwellbeing',
    seoTitle: `${title} | ${seoMainTitle}`,
    seoMetaDescription: 'We asked women around the world, what they want to improve their health and wellbeing.',
    respondentsNounSingular: 'woman',
    respondentsNounPlural: 'women',
    showVideoLink: 'https://www.youtube.com/watch?v=nBzide5J3Hk',
    link: {
        id: DashboardName.HEALTHWELLBEING,
        title: title,
        link: 'https://explore.whiteribbonalliance.org/healthwellbeing',
    },
}
