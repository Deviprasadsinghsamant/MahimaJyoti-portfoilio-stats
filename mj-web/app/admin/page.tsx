"use client";

import {
    Users,
    BookOpen,
    FileText,
    Image,
    Bell,
    Settings,
    BarChart3,
    TrendingUp,
    UserPlus,
    Calendar,
} from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const quickStats = [
    { icon: Users, label: "Total Students", value: "2,547", trend: "+12%", color: "from-blue-500 to-blue-700" },
    { icon: BookOpen, label: "Active Programs", value: "15", trend: "+2", color: "from-gold-500 to-gold-700" },
    { icon: UserPlus, label: "New Applications", value: "128", trend: "+34%", color: "from-emerald-500 to-emerald-700" },
    { icon: Bell, label: "Active Notices", value: "8", trend: "3 new", color: "from-purple-500 to-purple-700" },
];

const managementCards = [
    { icon: Users, title: "Faculty Management", desc: "Add, edit, or remove faculty profiles", href: "#", count: "120 members" },
    { icon: BookOpen, title: "Academic Programs", desc: "Manage courses, subjects, and curriculum", href: "#", count: "15 programs" },
    { icon: FileText, title: "Notices & Events", desc: "Publish notices and manage events", href: "#", count: "8 active" },
    { icon: Image, title: "Media Gallery", desc: "Upload photos and manage gallery albums", href: "#", count: "450 items" },
    { icon: UserPlus, title: "Admissions", desc: "Review applications and manage intake", href: "#", count: "128 pending" },
    { icon: Settings, title: "Site Settings", desc: "Configure institution details and content", href: "#", count: "General" },
];

const recentActivity = [
    { action: "New admission application from Priya Sahoo", time: "2 hours ago", type: "admission" },
    { action: "Notice published: Board Exam Schedule", time: "5 hours ago", type: "notice" },
    { action: "Faculty profile updated: Dr. Rajesh Panda", time: "1 day ago", type: "faculty" },
    { action: "Gallery album added: Science Exhibition 2026", time: "2 days ago", type: "media" },
    { action: "Event created: Annual Sports Day", time: "3 days ago", type: "event" },
];

export default function AdminDashboard() {
    return (
        <div className="pt-24 pb-16 bg-ivory-50 min-h-screen">
            <div className="container-narrow mx-auto px-4 sm:px-6">
                {/* Header */}
                <FadeIn>
                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                            Admin Dashboard
                        </h1>
                        <p className="text-muted mt-1">
                            Welcome back. Here&apos;s an overview of your institution.
                        </p>
                    </div>
                </FadeIn>

                {/* Stats */}
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {quickStats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={staggerItem}
                            className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                    <TrendingUp className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-2xl font-heading font-bold text-navy-950">
                                {stat.value}
                            </p>
                            <p className="text-xs text-muted mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </StaggerContainer>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Management Cards */}
                    <div className="lg:col-span-2">
                        <FadeIn>
                            <h2 className="text-lg font-heading font-bold text-navy-950 mb-5">
                                Content Management
                            </h2>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {managementCards.map((card) => (
                                <motion.a
                                    key={card.title}
                                    variants={staggerItem}
                                    href={card.href}
                                    className="group p-5 rounded-xl bg-white border border-gray-100 hover:border-gold-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0 group-hover:bg-gold-50 transition-colors">
                                            <card.icon className="w-5 h-5 text-navy-500 group-hover:text-gold-600 transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-navy-950 group-hover:text-gold-700 transition-colors">
                                                {card.title}
                                            </h3>
                                            <p className="text-xs text-muted mt-0.5">{card.desc}</p>
                                            <span className="inline-block mt-2 text-[10px] font-semibold text-navy-400 bg-navy-50 px-2 py-0.5 rounded-md">
                                                {card.count}
                                            </span>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </StaggerContainer>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <FadeIn>
                            <h2 className="text-lg font-heading font-bold text-navy-950 mb-5">
                                Recent Activity
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                                {recentActivity.map((activity, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                                        <div>
                                            <p className="text-sm text-navy-800 leading-snug">
                                                {activity.action}
                                            </p>
                                            <p className="text-xs text-muted mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>

                        {/* Quick Chart Placeholder */}
                        <FadeIn delay={0.3}>
                            <div className="mt-6 p-5 rounded-xl bg-white border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-navy-400" />
                                    <h3 className="text-sm font-semibold text-navy-950">
                                        Monthly Applications
                                    </h3>
                                </div>
                                <div className="flex items-end gap-1.5 h-24">
                                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 95, 88].map(
                                        (h, i) => (
                                            <div
                                                key={i}
                                                style={{ height: `${h}%` }}
                                                className="flex-1 rounded-t-md bg-gradient-to-t from-navy-200 to-navy-400 hover:from-gold-400 hover:to-gold-600 transition-colors cursor-pointer"
                                            />
                                        )
                                    )}
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-muted">
                                    <span>Jan</span>
                                    <span>Jun</span>
                                    <span>Dec</span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </div>
    );
}
