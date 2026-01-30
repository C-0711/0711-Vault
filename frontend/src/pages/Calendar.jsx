import { useState, useEffect } from 'react'
import api from '../lib/api'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [view, setView] = useState('month') // month, week, day

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  async function loadEvents() {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0).toISOString()
      
      const data = await api.request(`/calendar/events?start=${start}&end=${end}`)
      setEvents(data.events || [])
    } catch (err) {
      // Use demo events if API not available
      setEvents(getDemoEvents())
    }
  }

  function getDemoEvents() {
    const today = new Date()
    return [
      {
        id: '1',
        title: 'Team Meeting',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
        color: 'blue',
        description: 'Wöchentliches Team-Standup'
      },
      {
        id: '2',
        title: 'Arzt-Termin',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 30).toISOString(),
        color: 'red',
        description: 'Dr. Müller, Zahnarzt'
      },
      {
        id: '3',
        title: 'Geburtstag Lisa 🎂',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
        allDay: true,
        color: 'purple'
      },
      {
        id: '4',
        title: 'Projekt-Deadline',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString(),
        allDay: true,
        color: 'orange'
      },
      {
        id: '5',
        title: 'Yoga-Kurs',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 18, 0).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 19, 30).toISOString(),
        color: 'green',
        recurring: 'weekly'
      }
    ]
  }

  function getCalendarDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    
    const days = []
    
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }
    
    // Next month days
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }
    
    return days
  }

  function getEventsForDate(date) {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  function navigateMonth(delta) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  function isToday(date) {
    return date.toDateString() === new Date().toDateString()
  }

  function isSelected(date) {
    return date.toDateString() === selectedDate.toDateString()
  }

  function formatTime(isoString) {
    const date = new Date(isoString)
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const calendarDays = getCalendarDays()
  const selectedEvents = getEventsForDate(selectedDate)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalender</h1>
          <p className="text-zinc-400">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-zinc-900 rounded-lg p-1">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  view === v 
                    ? 'bg-white text-black' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : 'Tag'}
              </button>
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition text-sm"
            >
              Heute
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
            >
              →
            </button>
          </div>
          
          {/* Add Event */}
          <button
            onClick={() => {
              setEditingEvent(null)
              setShowEventModal(true)
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-400 transition"
          >
            + Event
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Calendar Grid */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-zinc-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const dayEvents = getEventsForDate(date)
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-1 rounded-xl text-left transition relative ${
                    isCurrentMonth ? '' : 'opacity-30'
                  } ${
                    isSelected(date) 
                      ? 'bg-orange-500/20 border-2 border-orange-500' 
                      : 'hover:bg-zinc-800'
                  } ${
                    isToday(date) ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isToday(date) ? 'text-orange-500' : 'text-white'
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  {/* Event Dots */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event, j) => (
                        <div
                          key={j}
                          className={`w-1.5 h-1.5 rounded-full bg-${event.color || 'blue'}-500`}
                          style={{ backgroundColor: getEventColor(event.color) }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <h3 className="font-medium text-white mb-4">
            {selectedDate.toLocaleDateString('de-DE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          
          {selectedEvents.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <div className="text-4xl mb-2">📅</div>
              <p>Keine Termine</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    setEditingEvent(event)
                    setShowEventModal(true)
                  }}
                  className="p-3 rounded-xl bg-zinc-800/50 border-l-4 cursor-pointer hover:bg-zinc-800 transition"
                  style={{ borderLeftColor: getEventColor(event.color) }}
                >
                  <div className="font-medium text-white">{event.title}</div>
                  {!event.allDay && (
                    <div className="text-sm text-zinc-400 mt-1">
                      {formatTime(event.date)}
                      {event.endDate && ` - ${formatTime(event.endDate)}`}
                    </div>
                  )}
                  {event.allDay && (
                    <div className="text-sm text-zinc-400 mt-1">Ganztägig</div>
                  )}
                  {event.description && (
                    <div className="text-sm text-zinc-500 mt-2">{event.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-6 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <h3 className="font-medium text-white mb-4">Kommende Termine</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {events
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 4)
            .map(event => (
              <div
                key={event.id}
                className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: getEventColor(event.color) }}
                  />
                  <div className="text-xs text-zinc-500">
                    {new Date(event.date).toLocaleDateString('de-DE', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </div>
                </div>
                <div className="mt-2 font-medium text-white">{event.title}</div>
                {!event.allDay && (
                  <div className="text-sm text-zinc-400">{formatTime(event.date)}</div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          onClose={() => setShowEventModal(false)}
          onSave={async (eventData) => {
            try {
              if (editingEvent) {
                await api.request(`/calendar/events/${editingEvent.id}`, {
                  method: 'PUT',
                  body: JSON.stringify(eventData)
                })
              } else {
                await api.request('/calendar/events', {
                  method: 'POST',
                  body: JSON.stringify(eventData)
                })
              }
              loadEvents()
            } catch (err) {
              // Demo mode - just add locally
              if (editingEvent) {
                setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e))
              } else {
                setEvents([...events, { id: Date.now().toString(), ...eventData }])
              }
            }
            setShowEventModal(false)
          }}
          onDelete={async () => {
            if (!editingEvent) return
            try {
              await api.request(`/calendar/events/${editingEvent.id}`, { method: 'DELETE' })
              loadEvents()
            } catch (err) {
              setEvents(events.filter(e => e.id !== editingEvent.id))
            }
            setShowEventModal(false)
          }}
        />
      )}
    </div>
  )
}

function getEventColor(color) {
  const colors = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    yellow: '#eab308',
    pink: '#ec4899',
    cyan: '#06b6d4'
  }
  return colors[color] || colors.blue
}

function EventModal({ event, selectedDate, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [date, setDate] = useState(
    event?.date 
      ? new Date(event.date).toISOString().slice(0, 16)
      : new Date(selectedDate.setHours(9, 0)).toISOString().slice(0, 16)
  )
  const [endDate, setEndDate] = useState(
    event?.endDate
      ? new Date(event.endDate).toISOString().slice(0, 16)
      : ''
  )
  const [allDay, setAllDay] = useState(event?.allDay || false)
  const [color, setColor] = useState(event?.color || 'blue')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      title,
      description,
      date: new Date(date).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      allDay,
      color
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {event ? 'Event bearbeiten' : 'Neues Event'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
              placeholder="Meeting, Geburtstag, ..."
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
              />
              <span className="text-white">Ganztägig</span>
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                {allDay ? 'Datum' : 'Start'}
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? date.slice(0, 10) : date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Ende</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Farbe</label>
            <div className="flex gap-2">
              {['blue', 'red', 'green', 'purple', 'orange', 'yellow', 'pink', 'cyan'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                  }`}
                  style={{ backgroundColor: getEventColor(c) }}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white resize-none"
              placeholder="Notizen..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            {event && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition"
              >
                Löschen
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-400 transition"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
