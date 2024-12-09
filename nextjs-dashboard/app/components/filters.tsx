"use client"
import { useState, useRef, useEffect } from "react";
import {Slider} from "@nextui-org/slider";
import {FiltersType} from "../helpers/db_helper";
import '../styles/globals.css';

export const Filters: React.FC<{ filters: FiltersType,  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>}> = ( {filters, setFilters}) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Track which dropdown is open
    const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({}); // References to each dropdown
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
            <div className="min-w-full">
            {['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other', 'Unknown'].map(cat => (
                <label key={cat} className="min-w-full" style={{ display: 'block', width: 'fit-content', marginBottom: '0.5rem' }}> 
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
                <Slider 
                    label="test"
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
                    classNames={{
                        base: "max-w-sm gap-3",
                    }}
                />
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
                classNames={{
                    base: "max-w-sm gap-3",
                  }}
            />
            </div>
        )
    }

    const toggleDropdown = (dropdown: string) => {
        console.log(dropdown)
        setOpenDropdown(openDropdown === dropdown ? null : dropdown); // Toggle the dropdown visibility
      };

    // close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        // close dropdown if clicked outside any open dropdown
        if (
            openDropdown &&
            dropdownRefs.current[openDropdown] &&
            !dropdownRefs.current[openDropdown]?.contains(event.target as Node)
        ) {
            console.log('test click outside')
            setOpenDropdown(null);
        }
        };

        // attach click event listener to document to detect outside clicks
        document.addEventListener("click", handleClickOutside);

        // cleanup event listener on component unmount
        return () => {
        document.removeEventListener("click", handleClickOutside);
        };
    }, [openDropdown]);

      // Hover to open/close
    const handleMouseEnter = (dropdown: string) => {
        if (openDropdown === null) {
        setOpenDropdown(dropdown);
        }
    };

    const handleMouseLeave = (dropdown: string) => {
        if (
            openDropdown == dropdown
        ) {
            setOpenDropdown(null);
        }
    };
    

    return (
<div className="p-4 pt-1 pb-1 space-y-4 bg-white">

  <div className="flex items-center space-x-4">
    {/* Title */}
    <h3 className="text-xl font-semibold">Filter by:</h3>
    {/* Filter Buttons */}
        <nav className="flex space-x-4">
        <div className="relative" 
            onMouseEnter={() => handleMouseEnter("categories")}
            onMouseLeave={() => handleMouseLeave("categories")}
        >
            <button
                onClick={() => toggleDropdown("categories")}

                className={`text-lg p-2 rounded-lg transition-colors duration-500 hover:bg-gray-50
                    ${openDropdown === "categories" ? "shadow-sm ring-1 ring-inset ring-gray-300 " : ""}`}   
            >
                Categories
            </button>
            {openDropdown === "categories" && (
            <div
                ref={(el) => (dropdownRefs.current["categories"] = el)}
                className="absolute left-1/2 transform -translate-x-1/2 pt-2"
                style={{minWidth: 'max-content',}}
            >
                <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <CategoryFilter />
                </div>
            </div>
            )}
        </div>

        <div className="relative"
            onMouseEnter={() => handleMouseEnter("dateRange")}
            onMouseLeave={() => handleMouseLeave("dateRange")}
        >
            <button
                onClick={() => toggleDropdown("dateRange")}

                className={`text-lg p-2 rounded-lg hover:bg-gray-50 
                ${openDropdown === "dateRange" ? "shadow-sm ring-1 ring-inset ring-gray-300 outline-none" : ""}`}
            >
            Date Range
            </button>
            {openDropdown === "dateRange" && (
            <div
                ref={(el) => (dropdownRefs.current["dateRange"] = el)}
                className="absolute left-1/2 transform -translate-x-1/2 pt-2"
                style={{minWidth: 'max-content',}}
            >
                <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <DateRangeFilter />
                </div>
            </div>
            )}
        </div>

        <div className="relative"
            onMouseEnter={() => handleMouseEnter("daysOfWeek")}
            onMouseLeave={() => handleMouseLeave("daysOfWeek")}
        >
        <button
            onClick={() => toggleDropdown("daysOfWeek")}

            className={`text-lg p-2 rounded-lg transition-colors duration-500 hover:bg-gray-50
                ${openDropdown === "daysOfWeek" ? "shadow-sm ring-1 ring-inset ring-gray-300 outline-none" : ""}`}
        >
          Days of Week
        </button>
        {openDropdown === "daysOfWeek" && (
            <div
                ref={(el) => (dropdownRefs.current["daysOfWeek"] = el)}
                 className="absolute left-1/2 transform -translate-x-1/2 pt-2"
                style={{minWidth: 'max-content',}}
            >
                <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <DaysOfWeekFilter />
                </div>
          </div>
        )}
      </div>

      <div className="relative"
            onMouseEnter={() => handleMouseEnter("timeRange")}
            onMouseLeave={() => handleMouseLeave("timeRange")}
      >
        <button
            onClick={() => toggleDropdown("timeRange")}

            className={`text-lg p-2 rounded-lg transition-colors duration-500 hover:bg-gray-50
            ${openDropdown === "timeRange" ? "shadow-sm ring-1 ring-inset ring-gray-300 " : ""}`}
        >
        Time Range
        </button>
        {openDropdown === "timeRange" && (
          <div
            ref={(el) => (dropdownRefs.current["timeRange"] = el)}
            className="absolute left-1/2 transform -translate-x-1/2 pt-2"
            style={{minWidth: '400px',}}
          >
            <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <Slider
                label="(24 hour time system)"
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
                className="max-w-sm gap-3 pb-2"
                />
            </div>
          </div>
        )}
      </div>

      <div className="relative"
        onMouseEnter={() => handleMouseEnter("timeToClear")}
        onMouseLeave={() => handleMouseLeave("timeToClear")}
      >
        <button
          onClick={() => toggleDropdown("timeToClear")}

          className={`text-lg p-2 rounded-lg transition-colors duration-500 hover:bg-gray-50
            ${openDropdown === "timeToClear" ?"shadow-sm ring-1 ring-inset ring-gray-300 " : ""}`}
          aria-expanded={openDropdown === "timeToClear" ? "true" : "false"}
        >
          Time to Clear
        </button>
        {openDropdown === "timeToClear" && (
          <div
            ref={(el) => (dropdownRefs.current["timeToClear"] = el)}
             className="absolute left-0 -translate-x-3/4 pt-2  md:left-1/2 transform md:-translate-x-1/2"
             style={{minWidth: 'max-content',}}
          >
            <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <Slider
                label="(minutes)"
                step={10}
                maxValue={120}
                minValue={0}
                value={[filters.timeToClear.minTime, filters.timeToClear.maxTime]}
                onChange={(value) => {
                    if (Array.isArray(value)){
                        handleTimeToClearChange(value[0], value[1])
                    }
                    else handleTimeToClearChange(value, value)
                }}
                className="max-w-sm gap-3 pb-5"
                />
                <AvailableTimesToClearOnlyFilter />
            </div>
        </div>
        )}
      </div>
      <div className="relative"
        onMouseEnter={() => handleMouseEnter("location")}
        onMouseLeave={() => handleMouseLeave("location")}
      >
        <button
          onClick={() => toggleDropdown("location")}

          className={`text-lg p-2 rounded-lg transition-colors duration-500 hover:bg-gray-50
            ${openDropdown === "location" ?"shadow-sm ring-1 ring-inset ring-gray-300 " : ""}`}
          aria-expanded={openDropdown === "location" ? "true" : "false"}
        >
          Location
        </button>
        {openDropdown === "location" && (
          <div
            ref={(el) => (dropdownRefs.current["location"] = el)}
             className="absolute left-0 -translate-x-[80%] pt-2 md:left-1/2 transform md:-translate-x-1/2 "
             style={{minWidth: 'max-content',}}
          >
            <div className="p-4 bg-white rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <p>Click on the map markers to filter events by those locations!</p>
            </div>
        </div>
        )}
      </div>
    </nav>
  </div>
</div>
      );
    };
