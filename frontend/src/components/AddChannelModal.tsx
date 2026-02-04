/**
 * Add/Edit Channel Modal - form for adding or editing a channel.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Link, FileText, Coins } from 'lucide-react'
import axios from 'axios'
import WebApp from '@twa-dev/sdk'

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

interface AddChannelModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (channel: Channel) => void
    /** If provided, modal is in edit mode with pre-filled data */
    initialData?: Channel | null
}

export default function AddChannelModal({
    isOpen,
    onClose,
    onSuccess,
    initialData
}: AddChannelModalProps) {
    const { t } = useTranslation()
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Determine if we're in edit mode
    const isEditMode = !!initialData

    // Populate form when editing
    useEffect(() => {
        if (isOpen && initialData) {
            setUrl(initialData.username ? `@${initialData.username}` : '')
            setDescription(initialData.description || '')
            setPrice(initialData.price_per_post?.toString() || '')
            setError(null)
        } else if (isOpen && !initialData) {
            // Reset form for new channel
            setUrl('')
            setDescription('')
            setPrice('')
            setError(null)
        }
    }, [isOpen, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!isEditMode && !url.trim()) {
            setError(t('error_invalid_url'))
            return
        }

        if (!price || parseFloat(price) <= 0) {
            setError(t('price_per_post') + ' required')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await axios.post(
                `${API_BASE}/channels/`,
                {
                    // Use existing username if editing, otherwise new URL
                    url: isEditMode
                        ? (initialData?.username ? `@${initialData.username}` : `${initialData?.telegram_id}`)
                        : url.trim(),
                    description: description.trim() || null,
                    price_per_post: parseFloat(price),
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': WebApp.initData,
                    },
                }
            )

            onSuccess(response.data)

        } catch (error: unknown) {
            console.error('Failed to save channel:', error)

            if (axios.isAxiosError(error) && error.response?.data?.detail) {
                const detail = error.response.data.detail

                // Map backend errors to localized messages
                if (detail.includes('not an administrator')) {
                    setError(t('error_bot_not_admin'))
                } else if (detail.includes('not found') || detail.includes('cannot access')) {
                    setError(t('error_channel_not_found'))
                } else if (detail.includes('already registered')) {
                    setError(t('error_channel_exists'))
                } else {
                    setError(detail)
                }
            } else {
                setError('Failed to save channel')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setUrl('')
        setDescription('')
        setPrice('')
        setError(null)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-lg bg-tg-bg rounded-t-3xl p-6 pb-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {isEditMode ? t('edit_channel') : t('add_channel')}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Channel Title (edit mode only) */}
                        {isEditMode && initialData && (
                            <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="font-medium">{initialData.title}</p>
                                {initialData.username && (
                                    <p className="text-sm text-tg-link">@{initialData.username}</p>
                                )}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Channel Link (only for new channels) */}
                            {!isEditMode && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                        <Link className="w-4 h-4 text-tg-hint" />
                                        {t('channel_link')}
                                    </label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        placeholder={t('channel_link_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <FileText className="w-4 h-4 text-tg-hint" />
                                    {t('channel_description')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder={t('channel_description_placeholder')}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Coins className="w-4 h-4 text-yellow-500" />
                                    {t('price_per_post')} ({t('ton')})
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder={t('price_per_post_placeholder')}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-tg-link focus:outline-none transition-colors"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-500/20 text-red-400 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl bg-white/10 font-medium hover:bg-white/20 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (!isEditMode && !url.trim()) || !price}
                                    className="flex-1 py-3 rounded-xl bg-tg-button text-tg-button-text font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('loading')}
                                        </>
                                    ) : (
                                        t('save')
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
