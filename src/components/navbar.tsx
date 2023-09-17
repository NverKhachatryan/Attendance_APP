import { Avatar, Dropdown } from "flowbite-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Fragment } from "react";
import { Menu } from "@headlessui/react";

import React from "react";

export default function Navbar() {
  const { data, status } = useSession();
  const imgUrl =
    data?.user?.image ||
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";

  return (
    <>
      {/* <div className="w-full"> */}
      <nav className="relative mx-0 lg:ml-4 lg:mr-14 xl:ml-4 xl:mr-14 2xl:ml-4 2xl:mr-14 flex flex-wrap items-center justify-between p-8 lg:justify-between px-0">
        <Menu as={Fragment}>
            <>
              <div className="flex w-full flex-wrap items-center justify-between lg:w-auto lg:ml-0">
                <Link href="/" legacyBehavior>
                  <a className="flex items-center space-x-2 text-2xl font-medium text-indigo-500 dark:text-gray-100">
                    <span className="text-4xl font-medium bg-gradient-to-r text-transparent bg-clip-text from-[#3F51B5] to-[#e183f5]">
                      Hello World
                    </span>
                  </a>
                </Link>
              </div>
            </>
        </Menu>

        <div className="nav__item hidden space-x-4  lg:flex">
          {status === "loading" && <img src="https://scontent.fevn6-1.fna.fbcdn.net/v/t1.30497-1/143086968_2856368904622192_1959732218791162458_n.png?stp=cp0_dst-png_p80x80&_nc_cat=1&ccb=1-7&_nc_sid=7206a8&_nc_ohc=OlcdNEVMsJMAX9O724Y&_nc_ht=scontent.fevn6-1.fna&oh=00_AfCkxF754_le5PfG2AszqctwWs85BVNajnt4AyI3uZC4Pw&oe=652D16B8" />}
          {status === "authenticated" && (
            <Dropdown
              arrowIcon={false}
              inline={true}
              label={<Avatar alt="User settings" img={imgUrl} rounded={true} className="w-12 h-12" />}
            >
              <Dropdown.Item>
                {status === "authenticated" && (
                  <button
                    className="w-full rounded-md bg-indigo-600 px-6 py-2 text-center text-white"
                    onClick={() =>
                      signOut({ callbackUrl: "/login" })
                    }
                  >
                    Sign Out
                  </button>
                )}
              </Dropdown.Item>
              <Dropdown.Divider />
            </Dropdown>
          )}
        </div>
      </nav>
      {/* </div> */}
    </>
  );
}

