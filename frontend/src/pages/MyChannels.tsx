/**
 * My Channels page - list and manage user's channels.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Plus,
    Loader2,
    Trash2,
    Radio,
    Coins
} from 'lucide-react'
import axios from 'axios'
import WebApp from '@twa-dev/sdk'
import AddChannelModal from '../components/AddChannelModal'

const API_BASE = '/api'

interface Channel {
    id: number
    telegram_id: number
    username: string | null
    title: string
    description: string | null
    price_per_post: number | null
    is_active: boolean
}

interface MyChannelsProps {
    onBack: () => void
}

export default function MyChannels({ onBack }: MyChannelsProps) {
    const { t } = useTranslation()
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    // Fetch channels on mount
    useEffect(() => {
        fetchChannels()
    }, [])

    const fetchChannels = async () => {
        setIsLoading(true)
        try {
            const response = await axios.get(`${API_BASE}/channels/my`, {
                headers: {
                    'X-Telegram-Init-Data': WebApp.initData,
                },
            })
            setChannels(response.data.channels)
        } catch (error) {
            console.error('Failed to fetch channels:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteChannel = async (channelId: number) => {
        if (!confirm(t('confirm_delete'))) return

        setDeletingId(channelId)
        try {
            await axios.delete(`${API_BASE}/channels/${channelId}`, {
                headers: {
                    'X-Telegram-Init-Data': WebApp.initData,
                },
            })
            setChannels(channels.filter(ch => ch.id !== channelId))
            WebApp.showAlert(t('channel_deleted'))
        } catch (error) {
            console.error('Failed to delete channel:', error)
        } finally {
            setDeletingId(null)
        }
    }

    const handleChannelAdded = (channel: Channel) => {
        setChannels([channel, ...channels])
        setShowAddModal(false)
        WebApp.showAlert(t('channel_added'))
    }

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

                <h1 className="text-xl font-bold">{t('my_channels')}</h1>

                <div className="w-16" /> {/* Spacer for centering */}
            </motion.div>

            {/* Add Channel Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowAddModal(true)}
                className="w-full glass-card flex items-center justify-center gap-2 mb-6 py-4 text-tg-link hover:bg-white/10 transition-colors"
            >
                <Plus className="w-5 h-5" />
                <span className="font-medium">{t('add_channel')}</span>
            </motion.button>

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
                    <p className="text-lg font-medium mb-2">{t('no_channels')}</p>
                    <p className="text-tg-hint text-sm">{t('no_channels_hint')}</p>
                </motion.div>
            ) : (
                /* Channels List */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
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
                                    <div className="flex-1">
                                        <h3 className="font-medium text-base">
                                            {channel.title}
                                        </h3>
                                        {channel.username && (
                                            <p className="text-tg-link text-sm">
                                                @{channel.username}
                                            </p>
                                        )}
                                        {channel.description && (
                                            <p className="text-tg-hint text-sm mt-1 line-clamp-2">
                                                {channel.description}
                                            </p>
                                        )}
                                        {channel.price_per_post && (
                                            <div className="flex items-center gap-1 mt-2 text-sm">
                                                <Coins className="w-4 h-4 text-yellow-500" />
                                                <span className="font-medium">
                                                    {channel.price_per_post} {t('ton')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteChannel(channel.id)}
                                        disabled={deletingId === channel.id}
                                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-500"
                                    >
                                        {deletingId === channel.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add Channel Modal */}
            <AddChannelModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleChannelAdded}
            />
        </div>
    )
}
