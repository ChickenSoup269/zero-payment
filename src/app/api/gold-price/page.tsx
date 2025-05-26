/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  RefreshCw,
  // Clock,
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { ValueType } from "recharts/types/component/DefaultTooltipContent"

type GoldPrice = {
  row: number
  name: string
  karat: string
  purity: string
  buyPrice: number
  sellPrice: number
  change: number
  date: string
  timestamp: string
  time: string
}

type ChartData = {
  time: string
  date: string
  name: string
  buyPrice: number
  sellPrice: number
  timestamp: string
}

const GoldPriceTracker = () => {
  const [goldData, setGoldData] = useState<GoldPrice[]>([])
  const [currentPrices, setCurrentPrices] = useState<GoldPrice[]>([])
  const [historicalData, setHistoricalData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedGoldType, setSelectedGoldType] = useState("VÀNG MIẾNG SJC")
  const [debugInfo, setDebugInfo] = useState<string>("")

  const API_URL = "/api/gold-prices"

  // Parse XML data with improved error handling
  const parseXMLData = (xmlString: string): GoldPrice[] => {
    try {
      if (!xmlString || xmlString.trim().length === 0) {
        throw new Error("Empty XML response")
      }

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, "text/xml")
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`)
      }

      const dataElements = xmlDoc.querySelectorAll("Data")
      setDebugInfo(`Found ${dataElements.length} Data elements`)

      if (dataElements.length === 0) {
        throw new Error("No Data elements found in XML")
      }

      const parsedData: GoldPrice[] = Array.from(dataElements).map(
        (element) => {
          const row = element.getAttribute("row") ?? "0"
          return {
            row: parseInt(row) || 0,
            name: element.getAttribute(`n_${row}`) ?? "Unknown",
            karat: element.getAttribute(`k_${row}`) ?? "Unknown",
            purity: element.getAttribute(`h_${row}`) ?? "Unknown",
            buyPrice: parseInt(element.getAttribute(`pb_${row}`) ?? "0") || 0,
            sellPrice: parseInt(element.getAttribute(`ps_${row}`) ?? "0") || 0,
            change: parseInt(element.getAttribute(`pt_${row}`) ?? "0") || 0,
            date:
              element.getAttribute(`d_${row}`) ??
              new Date().toLocaleDateString("vi-VN"),
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString("vi-VN"),
          }
        }
      )

      const validData = parsedData.filter(
        (item) =>
          item.name !== "Unknown" && (item.buyPrice > 0 || item.sellPrice > 0)
      )

      setDebugInfo(
        (prev) => prev + `\nParsed ${validData.length} valid entries`
      )

      return validData
    } catch (err) {
      setDebugInfo(
        (prev) => prev + `\nError parsing XML: ${(err as Error).message}`
      )
      console.error("Error parsing XML:", err)
      return []
    }
  }

  // Get unique gold types for current prices
  const getUniqueGoldTypes = (data: GoldPrice[]): GoldPrice[] => {
    const latest = data.reduce(
      (acc: { [key: string]: GoldPrice }, item: GoldPrice) => {
        if (
          item.name &&
          (!acc[item.name] ||
            new Date(item.timestamp) > new Date(acc[item.name].timestamp))
        ) {
          acc[item.name] = item
        }
        return acc
      },
      {}
    )
    return Object.values(latest)
  }

  // Check if new data differs from the latest historical data
  // Enhanced comparison to check for meaningful changes in a single item
  const hasDataChanged = (
    newItem: GoldPrice,
    latestHistorical?: GoldPrice
  ): boolean => {
    if (!latestHistorical) return true
    return (
      newItem.buyPrice !== latestHistorical.buyPrice ||
      newItem.sellPrice !== latestHistorical.sellPrice ||
      newItem.change !== latestHistorical.change ||
      newItem.karat !== latestHistorical.karat ||
      newItem.purity !== latestHistorical.purity
    )
  }

  // Compare entire API response with latest historical data
  const isApiDataIdentical = (
    parsedData: GoldPrice[],
    historical: GoldPrice[]
  ): boolean => {
    // Get unique gold types from parsed data
    const uniqueParsed = getUniqueGoldTypes(parsedData)

    // Get the latest historical entry for each gold type
    const latestHistoricalByName = historical.reduce(
      (acc: { [key: string]: GoldPrice }, item: GoldPrice) => {
        if (
          !acc[item.name] ||
          new Date(item.timestamp) > new Date(acc[item.name].timestamp)
        ) {
          acc[item.name] = item
        }
        return acc
      },
      {}
    )

    // Check if all parsed items match their latest historical counterparts
    return uniqueParsed.every((newItem) => {
      const latestHistorical = latestHistoricalByName[newItem.name]
      return !hasDataChanged(newItem, latestHistorical)
    })
  }

  // Fetch gold price data with localStorage integration
  const fetchGoldPrice = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDebugInfo("Fetching data...")

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/xml, text/xml, */*",
          "Cache-Control": "no-cache",
        },
      })

      setDebugInfo(
        (prev) =>
          prev +
          `\nAPI Response Status: ${response.status} ${response.statusText}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const xmlData = await response.text()
      setDebugInfo(
        (prev) => prev + `\nResponse received, length: ${xmlData.length}`
      )
      const parsedData = parseXMLData(xmlData)

      if (parsedData.length === 0) {
        throw new Error("No valid data received from API")
      }

      // Always update current prices with the latest API data
      const uniqueCurrentPrices = getUniqueGoldTypes(parsedData)
      setCurrentPrices(uniqueCurrentPrices)

      // Set default selected gold type if not set
      if (!selectedGoldType && uniqueCurrentPrices.length > 0) {
        setSelectedGoldType(uniqueCurrentPrices[0].name)
      }

      // Load historical data from localStorage
      const storedData = localStorage.getItem("goldPriceHistory")
      const historical: GoldPrice[] = storedData ? JSON.parse(storedData) : []

      // Check if the entire API response is identical to the latest historical data
      if (isApiDataIdentical(parsedData, historical)) {
        setDebugInfo(
          (prev) =>
            prev +
            "\nAPI data identical to latest historical data, skipping history update"
        )
        setLastUpdate(new Date())
        setLoading(false)
        return
      }

      // Filter new data to only include items with changes
      const newData = parsedData.filter((newItem) => {
        const latestHistorical = historical
          .filter((item) => item.name === newItem.name)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        const changed = hasDataChanged(newItem, latestHistorical)
        if (changed) {
          setDebugInfo(
            (prev) =>
              prev +
              `\nChange detected for ${newItem.name}: ` +
              `buyPrice: ${newItem.buyPrice} (was ${
                latestHistorical?.buyPrice ?? "none"
              }), ` +
              `sellPrice: ${newItem.sellPrice} (was ${
                latestHistorical?.sellPrice ?? "none"
              })`
          )
        }
        return changed
      })

      if (newData.length === 0) {
        setDebugInfo(
          (prev) =>
            prev +
            "\nNo individual price changes detected, skipping history update"
        )
        setLastUpdate(new Date())
        setLoading(false)
        return
      }

      // Update goldData and save to localStorage only if there are changes
      setGoldData((prev) => {
        const updatedData = [...prev, ...newData]
        const cappedData = updatedData.slice(-1000) // Keep last 1000 records
        localStorage.setItem("goldPriceHistory", JSON.stringify(cappedData))
        setDebugInfo(
          (prev) =>
            prev + `\nSaved ${newData.length} new records to localStorage`
        )
        return cappedData
      })

      // Prepare historical data for charts
      const chartData: ChartData[] = newData.map((item) => ({
        time: item.time,
        date: item.date,
        name: item.name,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        timestamp: item.timestamp,
      }))

      setHistoricalData((prev) => {
        const combined = [...prev, ...chartData]
        return combined.slice(-500) // Keep last 500 for charts
      })

      setLastUpdate(new Date())
      setDebugInfo(
        (prev) => prev + `\nSuccess! Updated ${newData.length} records`
      )
    } catch (err) {
      setError(`Lỗi khi lấy dữ liệu giá vàng: ${(err as Error).message}`)
      setDebugInfo((prev) => prev + `\nError: ${(err as Error).message}`)
      console.error("Error fetching gold price:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedGoldType])

  // Initialize from localStorage and set up auto-refresh
  useEffect(() => {
    // Load historical data from localStorage
    const storedData = localStorage.getItem("goldPriceHistory")
    if (storedData) {
      const parsedStoredData: GoldPrice[] = JSON.parse(storedData)
      setGoldData(parsedStoredData.slice(-1000))
      setHistoricalData(
        parsedStoredData.slice(-500).map((item) => ({
          time: item.time,
          date: item.date,
          name: item.name,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          timestamp: item.timestamp,
        }))
      )
    }

    fetchGoldPrice()
    const interval = setInterval(fetchGoldPrice, 60000)
    return () => clearInterval(interval)
  }, [fetchGoldPrice])

  // Export data as JSON
  const exportJSON = () => {
    const exportData = {
      currentPrices,
      historicalData: goldData,
      exportTime: new Date().toISOString(),
      totalRecords: goldData.length,
      debugInfo,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gold-price-data-${
      new Date().toISOString().split("T")[0]
    }.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export data as TXT
  const exportTXT = () => {
    const headers =
      "Thời gian\tNgày\tTên vàng\tGiá mua\tGiá bán\tKarat\tĐộ tinh khiết\n"
    const rows = goldData
      .map(
        (item) =>
          `${item.time}\t${item.date}\t${
            item.name
          }\t${item.buyPrice.toLocaleString(
            "vi-VN"
          )}\t${item.sellPrice.toLocaleString("vi-VN")}\t${item.karat}\t${
            item.purity
          }`
      )
      .join("\n")

    const dataStr = headers + rows
    const dataBlob = new Blob([dataStr], { type: "text/plain; charset=utf-8" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gold-price-data-${
      new Date().toISOString().split("T")[0]
    }.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format price for display
  const formatPrice = (price: number | ValueType) => {
    if (!price || price === 0) return "Không có giá"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price))
  }

  // Get chart data for selected gold type
  const getChartData = () => {
    return historicalData
      .filter((item) => item.name === selectedGoldType)
      .slice(-20)
      .map((item) => ({
        time: item.time,
        "Giá mua": item.buyPrice,
        "Giá bán": item.sellPrice || item.buyPrice,
      }))
  }

  // Calculate price statistics
  const getPriceStats = () => {
    if (currentPrices.length === 0) return null

    const prices = currentPrices.filter((p) => p.sellPrice > 0)
    if (prices.length === 0) return null

    const avgSellPrice =
      prices.reduce((sum, p) => sum + p.sellPrice, 0) / prices.length
    const maxPrice = Math.max(...prices.map((p) => p.sellPrice))
    const minPrice = Math.min(...prices.map((p) => p.sellPrice))

    return { avgSellPrice, maxPrice, minPrice }
  }

  const priceStats = getPriceStats()

  const getStatusIcon = () => {
    if (loading)
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
            🥇 Theo Dõi Giá Vàng BTMC
          </h1>
          <p className="text-gray-600">
            Giám sát giá vàng thời gian thực với lưu trữ dữ liệu tự động
          </p>
        </div>

        {/* Status and Controls */}
        <Card className="shadow-lg border-yellow-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon()}
                    Trạng thái hệ thống
                  </CardTitle>
                  <CardDescription>
                    Cập nhật lần cuối:{" "}
                    {lastUpdate
                      ? lastUpdate.toLocaleString("vi-VN")
                      : "Chưa có"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={loading ? "secondary" : "default"}
                    className="flex items-center gap-1"
                  >
                    <Database className="w-3 h-3" />
                    {goldData.length} bản ghi
                  </Badge>
                  <Badge variant="outline">
                    {currentPrices.length} loại vàng
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchGoldPrice}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </Button>
                <Button
                  onClick={exportJSON}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </Button>
                <Button
                  onClick={exportTXT}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  TXT
                </Button>
              </div>
            </div>
          </CardHeader>
          {error && (
            <CardContent>
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          {debugInfo && (
            <CardContent>
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {debugInfo}
                  </pre>
                </CardContent>
              </Card>
            </CardContent>
          )}
        </Card>

        {/* Price Statistics */}
        {priceStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-700">
                  Giá trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(priceStats.avgSellPrice)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-700">
                  Giá cao nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(priceStats.maxPrice)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-700">
                  Giá thấp nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(priceStats.minPrice)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Giá hiện tại</TabsTrigger>
            <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          {/* Current Prices Tab */}
          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentPrices.map((gold, index) => (
                <Card
                  key={index}
                  className="shadow-lg border-yellow-200 hover:shadow-xl transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{gold.name}</CardTitle>
                    <CardDescription className="flex gap-2">
                      <Badge variant="outline">{gold.karat}</Badge>
                      <Badge variant="outline">{gold.purity}‰</Badge>
                      <Badge variant="secondary">{gold.date}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Giá mua</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(gold.buyPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Giá bán</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatPrice(gold.sellPrice)}
                        </p>
                      </div>
                    </div>
                    {gold.sellPrice > 0 && gold.buyPrice > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">Chênh lệch</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {formatPrice(gold.sellPrice - gold.buyPrice)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Biểu đồ giá vàng</CardTitle>
                <CardDescription>
                  <select
                    value={selectedGoldType}
                    onChange={(e) => setSelectedGoldType(e.target.value)}
                    className="border rounded px-3 py-1 bg-white"
                  >
                    {[...new Set(currentPrices.map((p) => p.name))].map(
                      (name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      )
                    )}
                  </select>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" stroke="#666" fontSize={12} />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        tickFormatter={(value) =>
                          `${(value / 1000000).toFixed(1)}M`
                        }
                      />
                      <Tooltip
                        formatter={(value, name) => [formatPrice(value), name]}
                        labelStyle={{ color: "#333" }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Giá mua"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Giá bán"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Lịch sử giá vàng</CardTitle>
                <CardDescription>Hiển thị 20 bản ghi gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Thời gian</th>
                        <th className="text-left p-3">Tên vàng</th>
                        <th className="text-left p-3">Giá mua</th>
                        <th className="text-left p-3">Giá bán</th>
                        <th className="text-left p-3">Karat</th>
                        <th className="text-left p-3">Độ tinh khiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goldData
                        .slice(-20)
                        .reverse()
                        .map((item, index) => (
                          <tr
                            key={index}
                            className="border-b hover:bg-yellow-50 transition-colors"
                          >
                            <td className="p-3">
                              <div className="text-xs text-gray-500">
                                {item.date}
                              </div>
                              <div>{item.time}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{item.name}</div>
                            </td>
                            <td className="p-3 text-green-600 font-medium">
                              {formatPrice(item.buyPrice)}
                            </td>
                            <td className="p-3 text-red-600 font-medium">
                              {formatPrice(item.sellPrice)}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{item.karat}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">{item.purity}‰</Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default GoldPriceTracker
