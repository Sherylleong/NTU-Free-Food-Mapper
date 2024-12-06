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

    const handleTimeToClearChange = (minTime: number, maxTime: number) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            timeToClear: { minTime, maxTime }
        }));
    };

    return (
        <div>
            <h3>Filters</h3>
            {/* categories */}
            <div>
                <h4>Location Categories</h4>
                {['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other','Unknown/None'].map(cat => (
                    <label key={cat}>
                        <input
                            type="checkbox"
                            checked={filters.categories.includes(cat)}
                            onChange={() => handleCategoriesChange(cat)}
                        />
                        {cat}
                    </label>
                ))}
            </div>

            {/* date Range */}
            <div>
                <h4>Date Range</h4>
                <input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => handleDateChange(e.target.value, filters.dateRange.endDate)}
                />
                <span> to </span>
                <input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => handleDateChange(filters.dateRange.startDate, e.target.value)}
                />
            </div>

            {/* days of the Week */}
            <div>
                <h4>Days of the Week</h4>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day}>
                        <input
                            type="checkbox"
                            checked={filters.daysOfWeek.includes(day)}
                            onChange={() => handleDayChange(day)}
                        />
                        {day}
                    </label>
                ))}
            </div>


            {/* time Range */}
            <Slider 
                label="Timing of Free Food Notification (24-Hour Time)"
                step={1}
                maxValue={24}
                minValue={0}
                value={[filters.timeRange.startTime, filters.timeRange.endTime]} 
                onChange={(value) => {
                    if (Array.isArray(value)){
                        handleTimeRangeChange(value[0], value[1])
                    }
                    else handleTimeRangeChange(value, value)
                }}
                className="timerange-slider"
            />

            {/* time to Clear */}
            <Slider 
                label="Minutes Before Cleared (If Available)"
                step={1}
                maxValue={30}
                minValue={0}
                value={[filters.timeToClear.minTime, filters.timeToClear.maxTime]} 
                onChange={(value) => {
                    if (Array.isArray(value)){
                        handleTimeToClearChange(value[0], value[1])
                    }
                    else handleTimeToClearChange(value, value)
                }}
                className="timetoclear-slider"
            />
        </div>
    );
    }