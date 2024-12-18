"use client"
import React from 'react'
import Link from 'next/link';


export const Navbar = () => {
  return (
  <nav className ="flex items-center justify-between flex-wrap bg-gray-800 p-4">
    <div className ="flex items-center flex-shrink-0 text-white mr-6">
      <img src="/images/map-icon.png" className="h-8 pr-1 mx-auto"/>
      <span className ="font-semibold text-xl tracking-tight">NTU Free Food Mapper</span>
    </div>
    <div className="flex items-center space-x-4">
      <div className ="block lg:hidden ">
      </div>
        <div>
          <a href="https://t.me/s/freefoodntu" target="_blank" className ="flex items-center sm:text-sm sm:px-3 py-2 sm:leading-none sm:border sm:rounded text-teal-200 sm:border-teal-400 sm:hover:text-white sm:hover:border-white">
            <span className="hidden sm:inline">NTU Free Food Telegram</span>
            <img
              src="images/telegram-icon.png"  // Your image path here
              alt="NTU Free Food Telegram"
              className="w-6 h-6 sm:ml-2"  // Adjust size for the image
           />
          </a>
        </div>
        <div>
          <a href="https://github.com/Sherylleong/NTU-Free-Food-Mapper" target="_blank" className ="flex items-center sm:text-sm sm:px-3 py-2 sm:leading-none sm:border sm:rounded text-teal-200 sm:border-teal-400 sm:hover:text-white sm:hover:border-white">
            <span className="hidden sm:inline">View Code on Github</span>
            <img
              src="images/github-icon.png"  // Your image path here
              alt="NTU Free Food Telegram"
              className="w-6 h-6 sm:ml-2"  // Adjust size for the image
           />
          </a>

        </div>

    </div>
  </nav>
  )
}

export default Navbar
