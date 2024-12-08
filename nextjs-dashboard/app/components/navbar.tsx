"use client"
import React from 'react'
import Link from 'next/link';


const Navbar = () => {
  return (
  <nav className ="flex items-center justify-between flex-wrap bg-gray-800 p-6">
    <div className ="flex items-center flex-shrink-0 text-white mr-6">
      <img src="/images/map-icon.png" className="h-8 pr-1 mx-auto"/>
      <span className ="font-semibold text-xl tracking-tight">NTU Free Food Mapper</span>
    </div>
    <div className="flex items-center space-x-4">
      <div className ="block lg:hidden ">
        <button className ="flex items-center text-sm px-3 py-2 leading-none border rounded text-white border-white hover:text-teal-200 hover:border-teal-200 ">
          Filters
        </button>
      </div>
        <div>
          <a href="https://github.com/Sherylleong/NTUFreeFood-StatTracker" target="_blank" className ="flex items-center text-sm px-3 py-2 leading-none border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white ">Github</a>
        </div>
    </div>
  </nav>
  )
}

export default Navbar
