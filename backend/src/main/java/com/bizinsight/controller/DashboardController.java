package com.bizinsight.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    @GetMapping("/status")
    public Map<String, String> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("service", "BizInsight Java Backend");
        status.put("status", "online");
        return status;
    }
}
