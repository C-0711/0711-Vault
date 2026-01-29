import { useState } from 'react'
import { Search, Plus, Phone, Video, MoreVertical, Send, Image, Paperclip, Smile, Check, CheckCheck, Lock } from 'lucide-react'
import clsx from 'clsx'

const contacts = [
  { id: 1, name: 'Alex M.', lastMessage: 'Klingt gut, bis morgen!', time: '14:32', unread: 2, online: true },
  { id: 2, name: 'Sarah K.', lastMessage: 'Danke für die Dokumente 📄', time: '12:15', unread: 0, online: false },
  { id: 3, name: 'Familie', lastMessage: 'Mama: Wann kommst du?', time: 'gestern', unread: 5, online: true, isGroup: true },
  { id: 4, name: 'Tim W.', lastMessage: 'Die Fotos sind super!', time: 'gestern', unread: 0, online: false },
  { id: 5, name: 'Dr. Schmidt', lastMessage: 'Termin bestätigt', time: 'Mo', unread: 0, online: false },
]

const messages = [
  { id: 1, sender: 'other', text: 'Hey! Hast du die Fotos vom Wochenende?', time: '14:20' },
  { id: 2, sender: 'me', text: 'Ja, sind im Vault gesichert! Schick dir gleich ein paar.', time: '14:22', status: 'read' },
  { id: 3, sender: 'other', text: 'Super, danke! 🙌', time: '14:25' },
  { id: 4, sender: 'me', text: 'Hier sind sie:', time: '14:28', status: 'read' },
  { id: 5, sender: 'me', type: 'image', time: '14:28', status: 'read' },
  { id: 6, sender: 'other', text: 'Die sind richtig gut geworden!', time: '14:30' },
  { id: 7, sender: 'me', text: 'Klingt gut, bis morgen!', time: '14:32', status: 'delivered' },
]

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(contacts[0])
  const [newMessage, setNewMessage] = useState('')
  const [showChatList, setShowChatList] = useState(true)

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    // Send message logic here
    setNewMessage('')
  }

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex animate-fade-in">
      {/* Chat List */}
      <div className={clsx(
        'w-full md:w-80 flex-shrink-0 border-r border-white/10 flex flex-col',
        !showChatList && 'hidden md:flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Nachrichten</h1>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => { setSelectedChat(contact); setShowChatList(false); }}
              className={clsx(
                'w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left',
                selectedChat?.id === contact.id && 'bg-white/5'
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {contact.name.charAt(0)}
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{contact.name}</p>
                  <span className="text-xs text-gray-500">{contact.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
              </div>
              {contact.unread > 0 && (
                <span className="w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-black font-medium">
                  {contact.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className={clsx(
        'flex-1 flex flex-col',
        showChatList && 'hidden md:flex'
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 p-4 border-b border-white/10">
              <button 
                onClick={() => setShowChatList(true)}
                className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg"
              >
                ←
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {selectedChat.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedChat.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedChat.online ? 'Online' : 'Zuletzt online vor 2h'}
                </p>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* E2E Notice */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
                <Lock className="w-3 h-3" />
                Ende-zu-Ende verschlüsselt
              </div>
              
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex',
                    msg.sender === 'me' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    msg.sender === 'me' 
                      ? 'bg-green-500 text-black rounded-br-md' 
                      : 'bg-white/10 rounded-bl-md'
                  )}>
                    {msg.type === 'image' ? (
                      <div className="w-48 h-32 bg-black/20 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 opacity-50" />
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    <div className={clsx(
                      'flex items-center gap-1 mt-1',
                      msg.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}>
                      <span className={clsx(
                        'text-xs',
                        msg.sender === 'me' ? 'text-black/60' : 'text-gray-500'
                      )}>
                        {msg.time}
                      </span>
                      {msg.sender === 'me' && (
                        msg.status === 'read' 
                          ? <CheckCheck className="w-4 h-4 text-black/60" />
                          : <Check className="w-4 h-4 text-black/60" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Image className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus:outline-none focus:border-white/20"
                />
                <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                <button 
                  type="submit"
                  className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Wähle einen Chat aus</p>
          </div>
        )}
      </div>
    </div>
  )
}
