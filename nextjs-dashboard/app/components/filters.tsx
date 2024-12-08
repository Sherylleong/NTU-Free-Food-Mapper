"use client"
import {Slider} from "@nextui-org/slider";
import {FiltersType} from "../helpers/db_helper";


export const Filters: React.FC<{ filters: FiltersType,  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>}> = ( {filters, setFilters}) => {
    const handleCategoriesChange = (category: string) => {
        const updatedCategories = filters.categories.includes(category)
            ? filters.categories.filter(cat => cat !== category)
            : [...filters.categories, category];
        setFilters(prevFilters => ({ ...prevFilters, categories: updatedCategories }));
    };

    const handleDayChange = (day: string) => {
        const updatedDays = filters.daysOfWeek.includes(day)
            ? filters.daysOfWeek.filter(d => d !== day)
            : [...filters.daysOfWeek, day];
        setFilters(prevFilters => ({ ...prevFilters, daysOfWeek: updatedDays }));
    };

    const handleDateChange = (startDate: string, endDate: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            dateRange: { startDate: startDate, endDate: endDate }
        }));
    };

    const handleTimeRangeChange = (startTime: number, endTime: number) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            timeRange: { startTime, endTime }
        }));
    };
    const handleAvailableTimesToClearOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.checked)
        setFilters(prevFilters => ({
            ...prevFilters,
            availableTimesToClearOnly: event.target.checked
        }));
    };
    const handleTimeToClearChange = (minTime: number, maxTime: number) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            timeToClear: { minTime, maxTime }
        }));
    };

    const CategoryFilter = () => {
        return (
            <div>
            {['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other'].map(cat => (
                <label key={cat}  className="block mb-2">
                    <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => handleCategoriesChange(cat)}
                        className="mr-2"
                    />
                    {cat}
                </label>
            ))}
        </div>
        )
    }

    const DateRangeFilter = () => {
        return (
            <div>
                <input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => handleDateChange(e.target.value, filters.dateRange.endDate)}
                    className="border border-gray-300 rounded p-2 mr-2"
                />
                <span> to </span>
                <input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => handleDateChange(filters.dateRange.startDate, e.target.value)}
                    className="border border-gray-300 rounded p-2 ml-2"
                />
            </div>
        )
    }

    const DaysOfWeekFilter = () => {
        return (
            <div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="block mb-2">
                        <input
                            type="checkbox"
                            checked={filters.daysOfWeek.includes(day)}
                            onChange={() => handleDayChange(day)}
                            className="mr-2"
                        />
                        {day}
                    </label>
                ))}
            </div>
        )
    }
    const TimeRangeFilter = () => {
        return (
            <div>
                <Slider 
                    label=" "
                    step={1}
                    maxValue={24}
                    minValue={0}
                    value={[filters.timeRange.startTime, filters.timeRange.endTime]} 
                    onChangeEnd={(value) => {
                        if (Array.isArray(value)){
                            handleTimeRangeChange(value[0], value[1])
                        }
                        else handleTimeRangeChange(value, value)
                    }}
                    classNames={{
                        base: "max-w-sm gap-3",
                    }}
                />
            </div>
        )
    }
    const AvailableTimesToClearOnlyFilter = () => {
        return (
            <div>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={filters.availableTimesToClearOnly}
                        onChange={handleAvailableTimesToClearOnlyChange}
                        className="mr-2"
                    />
                    {'Only see events that have estimated clearing times'}
                    </label>
            </div>
        )
    }

    const TimeToClearFilter = () => {
        return (
            <div>
                <h4 className="text-xl font-medium mb-2">Minutes Before Cleared (If Available)</h4>
                <Slider 
                    label=" "
                    step={1}
                    maxValue={30}
                    minValue={0}
                    value={[filters.timeToClear.minTime, filters.timeToClear.maxTime]}
                    onChangeEnd={(value) => {
                        if (Array.isArray(value)){
                            handleTimeToClearChange(value[0], value[1])
                        }
                        else handleTimeToClearChange(value, value)
                    }}
                    classNames={{
                        base: "max-w-sm gap-3",
                    }}
                />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-2xl font-semibold">Filters</h3>
            {/* categories */}
            <CategoryFilter />

            {/* date Range */}
            <DateRangeFilter />

            {/* days of the Week */}
            <DaysOfWeekFilter />


            {/* time Range */}
            <TimeRangeFilter />
            
            {/* checkbox for only estimated times to clear */}
            <AvailableTimesToClearOnlyFilter />

            {/* time to Clear */}
            <TimeToClearFilter/>
        </div>
    );
    }