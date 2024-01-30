import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { classNames } from '@utils'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { LegacyDashboardName } from '@enums'

interface ISpinnerProps {
    dashboard: string
}

export const Spinner = ({ dashboard }: ISpinnerProps) => {
    // Set spinner icon classes
    let spinnerIconClasses: string
    switch (dashboard) {
        case LegacyDashboardName.WHAT_YOUNG_PEOPLE_WANT:
            spinnerIconClasses = 'text-pmnchColors-primary'
            break
        case LegacyDashboardName.WORLD_WE_WANT_DATA_EXCHANGE:
            spinnerIconClasses = 'text-dataExchangeColors-secondary'
            break
        default:
            spinnerIconClasses = 'text-defaultColors-tertiary'
    }

    return (
        <div className="my-5 flex items-center justify-center">
            <FontAwesomeIcon className={classNames('animate-spin text-3xl', spinnerIconClasses)} icon={faSpinner} />
        </div>
    )
}
