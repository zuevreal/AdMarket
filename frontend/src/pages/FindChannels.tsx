/**
 * Find Channels page - marketplace showcase for advertisers.
 */

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Search,
    Filter,
    X,
    Loader2,
    Radio,
    Coins,
    Users,
    ShoppingCart,
    ChevronDown
} from 'lucide-react'
import axios from 'axios'

const API_BASE = '/api'

// Channel categories
const CATEGORIES = ['crypto', 'business', 'tech', 'news', 'entertainment', 'other']

interface MarketChannel {
    id: number
    username: string | null
    title: string
    description: string | null
    price_per_post: number
    category: string | null
    subscribers: number | null
}

interface FindChannelsProps {
    onBack: () => void
    onBuyAd?: (channel: MarketChannel) => void
}

export default function FindChannels({ onBack, onBuyAd }: FindChannelsProps) {
    const { t } = useTranslation()
    const [channels, setChannels] = useState<MarketChannel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')

    // Fetch channels with debounce
    const fetchChannels = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchQuery) params.append('query', searchQuery)
            if (selectedCategory) params.append('category', selectedCategory)
            if (minPrice) params.append('min_price', minPrice)
            if (maxPrice) params.append('max_price', maxPrice)

            const response = await axios.get(`${API_BASE}/channels/market?${params.toString()}`)
            setChannels(response.data.channels)
        } catch (error) {
            console.error('Failed to fetch channels:', error)
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, selectedCategory, minPrice, maxPrice])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchChannels()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchChannels])

    // Format subscriber count
    const formatSubscribers = (count: number | null) => {
        if (count === null) return null
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('')
        setSelectedCategory('')
        setMinPrice('')
        setMaxPrice('')
    }

    const hasActiveFilters = selectedCategory || minPrice || maxPrice

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-tg-link"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{t('back')}</span>
                </button>

                <h1 className="text-xl font-bold">{t('find_channels')}</h1>

                <div className="w-16" /> {/* Spacer */}
            </motion.div>

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
            >
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tg-hint" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('search_channels')}
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-tg-hint" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Filter Toggle */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
            >
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${hasActiveFilters ? 'bg-tg-button text-tg-button-text' : 'bg-white/10'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    <span>{t('filters')}</span>
                    {hasActiveFilters && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {[selectedCategory, minPrice, maxPrice].filter(Boolean).length}
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </motion.div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="glass-card space-y-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('category')}
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                                >
                                    <option value="">{t('all_categories')}</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>
                                            {t(`cat_${cat}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('price_range')} ({t('ton')})
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={minPrice}
                                        onChange={e => setMinPrice(e.target.value)}
                                        placeholder="Min"
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                                    />
                                    <span className="py-3 text-tg-hint">—</span>
                                    <input
                                        type="number"
                                        value={maxPrice}
                                        onChange={e => setMaxPrice(e.target.value)}
                                        placeholder="Max"
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-tg-link hover:underline"
                                >
                                    {t('clear_filters')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-tg-link animate-spin" />
                    <p className="text-tg-hint mt-3">{t('loading')}</p>
                </div>
            ) : channels.length === 0 ? (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                        <Radio className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-lg font-medium mb-2">{t('no_results')}</p>
                    <p className="text-tg-hint text-sm">{t('try_different_filters')}</p>
                </motion.div>
            ) : (
                /* Channels List */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    <p className="text-sm text-tg-hint mb-2">
                        {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
                    </p>
                    <AnimatePresence>
                        {channels.map((channel, index) => (
                            <motion.div
                                key={channel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        {/* Title & Category */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-medium text-base truncate">
                                                {channel.title}
                                            </h3>
                                            {channel.category && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-tg-button/30 text-tg-link uppercase">
                                                    {t(`cat_${channel.category}`)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Username & Subscribers */}
                                        <div className="flex items-center gap-2 text-sm text-tg-hint mt-1">
                                            {channel.username && (
                                                <span className="text-tg-link">@{channel.username}</span>
                                            )}
                                            {channel.subscribers && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {formatSubscribers(channel.subscribers)} {t('subscribers')}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {channel.description && (
                                            <p className="text-tg-hint text-sm mt-2 line-clamp-2">
                                                {channel.description}
                                            </p>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-center gap-1 mt-3">
                                            <Coins className="w-4 h-4 text-yellow-500" />
                                            <span className="font-bold text-lg">
                                                {parseFloat(String(channel.price_per_post))}
                                            </span>
                                            <span className="text-tg-hint text-sm">{t('ton')} / {t('per_post')}</span>
                                        </div>
                                    </div>

                                    {/* Buy Button */}
                                    <button
                                        onClick={() => onBuyAd?.(channel)}
                                        className="ml-3 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {t('buy_ad')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    )
}
